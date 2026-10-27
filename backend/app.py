import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db_connection, init_db
from risk_engine import calculate_street_flood_risk

app = Flask(__name__)
CORS(app)

def get_system_weights():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT setting_key, setting_value FROM system_settings WHERE category = 'scoring_engine'")
    rows = cursor.fetchall()
    conn.close()
    
    weights = {
        'rainfall_weight': 0.35,
        'drainage_deficit_weight': 0.30,
        'blockage_weight': 0.15,
        'impervious_slope_weight': 0.12,
        'crowd_report_weight': 0.08
    }
    for row in rows:
        key = row['setting_key']
        if key in weights:
            try:
                weights[key] = float(row['setting_value'])
            except ValueError:
                pass
    return weights

def log_activity(event_type, actor, role, description, metadata=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
        INSERT INTO activity_logs (event_type, actor, role, description, ip_address, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (event_type, actor, role, description, request.remote_addr or '127.0.0.1', json.dumps(metadata or {})))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error logging activity: {e}")

# --- HEALTH ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Urban Flood Nowcasting System API',
        'version': '2.4.0',
        'environment': 'Production Demonstration',
        'disclaimer': 'Experimental nowcasting system with fictional Indian demonstration datasets.'
    })

# --- DASHBOARD STATS ---
@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    city = request.args.get('city')
    conn = get_db_connection()
    cursor = conn.cursor()

    # Base street filter
    street_query = "SELECT * FROM streets"
    street_params = []
    if city and city != 'All Cities':
        street_query += " WHERE city = ?"
        street_params.append(city)
    
    cursor.execute(street_query, street_params)
    streets = [dict(row) for row in cursor.fetchall()]

    # Fetch drainage
    cursor.execute("SELECT * FROM drainage")
    drainage_map = {row['street_id']: dict(row) for row in cursor.fetchall()}

    # Fetch rainfall
    rain_query = "SELECT * FROM rainfall_readings"
    rain_params = []
    if city and city != 'All Cities':
        rain_query += " WHERE city = ?"
        rain_params.append(city)
    cursor.execute(rain_query, rain_params)
    rain_readings = [dict(row) for row in cursor.fetchall()]
    avg_rainfall = sum(r['current_intensity_mm_hr'] for r in rain_readings) / max(1, len(rain_readings))
    max_rainfall = max((r['current_intensity_mm_hr'] for r in rain_readings), default=0.0)

    # Fetch citizen report counts per street
    cursor.execute("SELECT street_name, COUNT(*) as cnt FROM citizen_reports WHERE status != 'Rejected' GROUP BY street_name")
    citizen_counts = {row['street_name']: row['cnt'] for row in cursor.fetchall()}

    # Calculate dynamic risk for each street
    weights = get_system_weights()
    high_risk_count = 0
    severe_risk_count = 0
    moderate_risk_count = 0
    low_risk_count = 0
    total_blocked_drains = 0
    high_risk_streets = []

    for st in streets:
        st_id = st['id']
        dr = drainage_map.get(st_id)
        if dr and (dr['current_blockage_pct'] >= 50.0 or dr['desilt_status'] == 'Overdue'):
            total_blocked_drains += 1

        # Find matching city rainfall reading or nearest
        rf = next((r for r in rain_readings if r['city'] == st['city']), rain_readings[0] if rain_readings else None)
        c_count = citizen_counts.get(st['name'], 0)
        risk_result = calculate_street_flood_risk(st, dr, rf, c_count, weights)
        st['computed_risk'] = risk_result

        sev = risk_result['severity']
        if sev == 'red':
            severe_risk_count += 1
            high_risk_count += 1
            high_risk_streets.append(st)
        elif sev == 'orange':
            high_risk_count += 1
            high_risk_streets.append(st)
        elif sev == 'yellow':
            moderate_risk_count += 1
        else:
            low_risk_count += 1

    # Active alerts count
    alert_query = "SELECT COUNT(*) FROM flood_alerts WHERE status = 'Active'"
    alert_params = []
    if city and city != 'All Cities':
        alert_query += " AND city = ?"
        alert_params.append(city)
    cursor.execute(alert_query, alert_params)
    active_alerts_count = cursor.fetchone()[0]

    # Recent incidents
    incident_query = "SELECT * FROM municipal_responses ORDER BY created_at DESC LIMIT 5"
    cursor.execute(incident_query)
    recent_incidents = [dict(row) for row in cursor.fetchall()]

    # Active citizen reports
    rep_query = "SELECT * FROM citizen_reports ORDER BY created_at DESC LIMIT 5"
    cursor.execute(rep_query)
    recent_reports = [dict(row) for row in cursor.fetchall()]

    conn.close()

    # Sort high risk streets by score descending
    high_risk_streets.sort(key=lambda s: s['computed_risk']['risk_score'], reverse=True)

    return jsonify({
        'total_monitored_streets': len(streets),
        'average_rainfall_mm_hr': round(avg_rainfall, 1),
        'max_rainfall_mm_hr': round(max_rainfall, 1),
        'high_risk_locations_count': high_risk_count,
        'severe_risk_count': severe_risk_count,
        'moderate_risk_count': moderate_risk_count,
        'low_risk_count': low_risk_count,
        'blocked_drains_count': total_blocked_drains,
        'active_alerts_count': active_alerts_count,
        'recent_incidents': recent_incidents,
        'recent_citizen_reports': recent_reports,
        'high_risk_spotlight': high_risk_streets[:6],
        'experimental_label': 'Experimental Nowcasting Engine (Demo)'
    })

# --- STREETS & DETAILED RISK ANALYSIS ---
@app.route('/api/streets', methods=['GET'])
def get_streets():
    city = request.args.get('city')
    search = request.args.get('search', '').lower()
    risk_filter = request.args.get('risk') # green, yellow, orange, red

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM streets"
    params = []
    if city and city != 'All Cities':
        query += " WHERE city = ?"
        params.append(city)
    cursor.execute(query, params)
    streets = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT * FROM drainage")
    drainage_map = {row['street_id']: dict(row) for row in cursor.fetchall()}

    cursor.execute("SELECT * FROM rainfall_readings")
    rain_readings = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT street_name, COUNT(*) as cnt FROM citizen_reports WHERE status != 'Rejected' GROUP BY street_name")
    citizen_counts = {row['street_name']: row['cnt'] for row in cursor.fetchall()}

    conn.close()

    weights = get_system_weights()
    results = []

    for st in streets:
        st_id = st['id']
        dr = drainage_map.get(st_id)
        rf = next((r for r in rain_readings if r['city'] == st['city']), rain_readings[0] if rain_readings else None)
        c_count = citizen_counts.get(st['name'], 0)

        risk_data = calculate_street_flood_risk(st, dr, rf, c_count, weights)
        st['drainage'] = dr
        st['rainfall'] = rf
        st['citizen_reports_count'] = c_count
        st['risk_analysis'] = risk_data

        # Filter by search
        if search:
            match_name = search in st['name'].lower()
            match_ward = search in st['ward_name'].lower()
            match_city = search in st['city'].lower()
            if not (match_name or match_ward or match_city):
                continue

        # Filter by risk severity
        if risk_filter and risk_filter != 'all':
            if risk_data['severity'] != risk_filter:
                continue

        results.append(st)

    # Sort by risk score descending
    results.sort(key=lambda s: s['risk_analysis']['risk_score'], reverse=True)

    return jsonify({
        'streets': results,
        'count': len(results),
        'disclaimer': 'Risk scores are experimental estimates combining rainfall telemetry, drainage capacity, and slope parameters.'
    })

@app.route('/api/streets/<int:street_id>', methods=['GET'])
def get_street_detail(street_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM streets WHERE id = ?", (street_id,))
    st_row = cursor.fetchone()
    if not st_row:
        conn.close()
        return jsonify({'error': 'Street not found'}), 404
    street = dict(st_row)

    cursor.execute("SELECT * FROM drainage WHERE street_id = ?", (street_id,))
    dr_row = cursor.fetchone()
    drainage = dict(dr_row) if dr_row else None

    cursor.execute("SELECT * FROM rainfall_readings WHERE city = ?", (street['city'],))
    rain_readings = [dict(r) for r in cursor.fetchall()]
    rf = rain_readings[0] if rain_readings else None

    cursor.execute("SELECT * FROM citizen_reports WHERE street_name = ? ORDER BY created_at DESC", (street['name'],))
    citizen_reports = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM flood_alerts WHERE street_id = ? ORDER BY timestamp DESC", (street_id,))
    alerts = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM municipal_responses WHERE street_name = ? ORDER BY created_at DESC", (street['name'],))
    incidents = [dict(r) for r in cursor.fetchall()]

    conn.close()

    weights = get_system_weights()
    risk_analysis = calculate_street_flood_risk(street, drainage, rf, len(citizen_reports), weights)

    return jsonify({
        'street': street,
        'drainage': drainage,
        'rainfall': rf,
        'risk_analysis': risk_analysis,
        'citizen_reports': citizen_reports,
        'alerts': alerts,
        'municipal_responses': incidents
    })

# --- RAINFALL MONITORING ---
@app.route('/api/rainfall', methods=['GET'])
def get_rainfall_monitoring():
    city = request.args.get('city')
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM rainfall_readings"
    params = []
    if city and city != 'All Cities':
        query += " WHERE city = ?"
        params.append(city)
    
    cursor.execute(query, params)
    readings = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Generate synthetic 24h hourly trends for telemetry charts
    hourly_trends = []
    hours = ["-24h", "-20h", "-16h", "-12h", "-8h", "-6h", "-4h", "-3h", "-2h", "-1h", "Now", "+1h (F)", "+2h (F)"]
    base_factor = [0.1, 0.15, 0.22, 0.35, 0.6, 0.8, 0.95, 1.1, 1.25, 1.15, 1.0, 1.05, 0.85]
    
    for h, factor in zip(hours, base_factor):
        sample_intensity = round(readings[0]['current_intensity_mm_hr'] * factor if readings else 35.0 * factor, 1)
        hourly_trends.append({
            'time': h,
            'intensity_mm_hr': sample_intensity,
            'is_forecast': '(F)' in h
        })

    return jsonify({
        'readings': readings,
        'hourly_trends': hourly_trends,
        'summary': {
            'total_stations': len(readings),
            'max_intensity': max((r['current_intensity_mm_hr'] for r in readings), default=0.0),
            'max_station': max(readings, key=lambda x: x['current_intensity_mm_hr'])['station_name'] if readings else 'N/A'
        },
        'disclaimer': 'Demonstration telemetry based on synthetic AWS and Doppler radar feeds.'
    })

# --- DRAINAGE MANAGEMENT (FULL CRUD) ---
@app.route('/api/drainage', methods=['GET'])
def get_drainage_records():
    search = request.args.get('search', '').lower()
    status_filter = request.args.get('status') # Overdue, Due, Recent
    city = request.args.get('city')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = '''
    SELECT d.*, s.name as street_name, s.city, s.ward_name, s.ward_no, s.latitude, s.longitude
    FROM drainage d
    JOIN streets s ON d.street_id = s.id
    '''
    params = []
    conditions = []

    if city and city != 'All Cities':
        conditions.append("s.city = ?")
        params.append(city)
    if status_filter and status_filter != 'all':
        conditions.append("d.desilt_status = ?")
        params.append(status_filter)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY d.current_blockage_pct DESC"

    cursor.execute(query, params)
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()

    if search:
        records = [r for r in records if search in r['drain_code'].lower() or search in r['street_name'].lower() or search in r['drain_type'].lower()]

    return jsonify({
        'drainage_records': records,
        'count': len(records)
    })

@app.route('/api/drainage', methods=['POST'])
def create_drainage_record():
    data = request.json
    street_id = data.get('street_id')
    drain_code = data.get('drain_code')
    drain_type = data.get('drain_type', 'RCC Box Storm Drain')
    nominal_capacity = float(data.get('nominal_capacity_mm_hr', 45.0))
    current_blockage = float(data.get('current_blockage_pct', 15.0))
    silt_depth = float(data.get('silt_depth_cm', 10.0))
    structural_status = data.get('structural_status', 'Good')
    last_inspected = data.get('last_inspected', datetime.now().strftime('%Y-%m-%d'))
    desilt_status = data.get('desilt_status', 'Recent')
    maintenance_crew = data.get('maintenance_crew', 'Ward Desilting Wing')
    discharge_outfall = data.get('discharge_outfall', 'Stormwater Canal Outfall')

    if not street_id or not drain_code:
        return jsonify({'error': 'street_id and drain_code are required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
        INSERT INTO drainage (street_id, drain_code, drain_type, nominal_capacity_mm_hr, current_blockage_pct, silt_depth_cm, structural_status, last_inspected, desilt_status, maintenance_crew, discharge_outfall)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (street_id, drain_code, drain_type, nominal_capacity, current_blockage, silt_depth, structural_status, last_inspected, desilt_status, maintenance_crew, discharge_outfall))
        conn.commit()
        drain_id = cursor.lastrowid
        conn.close()

        log_activity('DRAIN_RECORD_CREATED', 'Ward Engineer', 'Municipal Officer', f"Created drainage record {drain_code} for Street ID {street_id}")

        return jsonify({'message': 'Drainage record created successfully', 'id': drain_id}), 201
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({'error': f"Duplicate drain_code or database conflict: {str(e)}"}), 400

@app.route('/api/drainage/<int:drain_id>', methods=['PUT'])
def update_drainage_record(drain_id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM drainage WHERE id = ?", (drain_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Drainage record not found'}), 404

    nominal_cap = float(data.get('nominal_capacity_mm_hr', existing['nominal_capacity_mm_hr']))
    blockage = float(data.get('current_blockage_pct', existing['current_blockage_pct']))
    silt = float(data.get('silt_depth_cm', existing['silt_depth_cm']))
    struct = data.get('structural_status', existing['structural_status'])
    insp = data.get('last_inspected', existing['last_inspected'])
    desilt = data.get('desilt_status', existing['desilt_status'])
    crew = data.get('maintenance_crew', existing['maintenance_crew'])
    outfall = data.get('discharge_outfall', existing['discharge_outfall'])

    cursor.execute('''
    UPDATE drainage
    SET nominal_capacity_mm_hr = ?, current_blockage_pct = ?, silt_depth_cm = ?,
        structural_status = ?, last_inspected = ?, desilt_status = ?,
        maintenance_crew = ?, discharge_outfall = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    ''', (nominal_cap, blockage, silt, struct, insp, desilt, crew, outfall, drain_id))
    conn.commit()
    conn.close()

    log_activity('DRAIN_RECORD_UPDATED', 'Ward Engineer', 'Municipal Officer', f"Updated drainage {existing['drain_code']}: Blockage={blockage}%, Desilt={desilt}")

    return jsonify({'message': 'Drainage record updated successfully'})

@app.route('/api/drainage/<int:drain_id>', methods=['DELETE'])
def delete_drainage_record(drain_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT drain_code FROM drainage WHERE id = ?", (drain_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Drainage record not found'}), 404

    drain_code = row['drain_code']
    cursor.execute("DELETE FROM drainage WHERE id = ?", (drain_id,))
    conn.commit()
    conn.close()

    log_activity('DRAIN_RECORD_DELETED', 'Ward Engineer', 'Municipal Officer', f"Deleted drainage record {drain_code}")

    return jsonify({'message': f"Drainage record {drain_code} deleted successfully"})

# --- FLOOD ALERTS & DEDUPLICATION ENGINE ---
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    city = request.args.get('city')
    severity = request.args.get('severity')
    status = request.args.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM flood_alerts WHERE 1=1"
    params = []

    if city and city != 'All Cities':
        query += " AND city = ?"
        params.append(city)
    if severity and severity != 'all':
        query += " AND severity = ?"
        params.append(severity)
    if status and status != 'all':
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY timestamp DESC"
    cursor.execute(query, params)
    alerts = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        'alerts': alerts,
        'count': len(alerts),
        'disclaimer': 'Demonstration alerts generated by configurable rule threshold engine.'
    })

@app.route('/api/alerts/generate', methods=['POST'])
def trigger_alert_generation():
    """Evaluates all streets against current rainfall & drainage. Generates deduplicated alerts if score > threshold."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get settings for thresholds
    cursor.execute("SELECT setting_key, setting_value FROM system_settings WHERE category = 'alert_thresholds'")
    settings = {row['setting_key']: float(row['setting_value']) for row in cursor.fetchall()}
    yellow_thresh = settings.get('threshold_yellow', 30.0)
    orange_thresh = settings.get('threshold_orange', 55.0)
    red_thresh = settings.get('threshold_red', 80.0)

    cursor.execute("SELECT * FROM streets")
    streets = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM drainage")
    drainage_map = {r['street_id']: dict(r) for r in cursor.fetchall()}

    cursor.execute("SELECT * FROM rainfall_readings")
    rain_readings = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT street_name, COUNT(*) as cnt FROM citizen_reports WHERE status != 'Rejected' GROUP BY street_name")
    citizen_counts = {r['street_name']: r['cnt'] for r in cursor.fetchall()}

    # Existing active deduplication keys
    cursor.execute("SELECT deduplication_key FROM flood_alerts WHERE status = 'Active'")
    existing_keys = set(row['deduplication_key'] for row in cursor.fetchall())

    weights = get_system_weights()
    generated = []

    today_str = datetime.now().strftime('%Y-%m-%d')

    for st in streets:
        st_id = st['id']
        dr = drainage_map.get(st_id)
        rf = next((r for r in rain_readings if r['city'] == st['city']), rain_readings[0] if rain_readings else None)
        c_count = citizen_counts.get(st['name'], 0)
        risk = calculate_street_flood_risk(st, dr, rf, c_count, weights)

        score = risk['risk_score']
        if score >= yellow_thresh:
            dedup_key = f"{st['city'][:3].upper()}-{st_id}-{today_str}"
            if dedup_key in existing_keys:
                continue  # Prevent duplicate alert for the same street on the same day

            alert_code = f"ALT-{st['city'][:3].upper()}-{datetime.now().strftime('%m%d%H%M')}-{st_id}"
            title = f"{risk['risk_level'].upper()}: {st['name']}"
            msg = f"Simulated rainfall load ({risk['effective_rainfall_mm_hr']} mm/hr) vs effective drainage ({risk['effective_drainage_capacity_mm_hr']} mm/hr). Risk score {score}/100."
            rec = risk['action_summary']

            cursor.execute('''
            INSERT INTO flood_alerts (alert_code, street_id, street_name, ward_name, city, severity, risk_score, title, message, recommendation, status, deduplication_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)
            ''', (alert_code, st_id, st['name'], st['ward_name'], st['city'], risk['severity'], score, title, msg, rec, dedup_key))
            
            existing_keys.add(dedup_key)
            generated.append(alert_code)

    conn.commit()
    conn.close()

    if generated:
        log_activity('ALERTS_GENERATED', 'Nowcasting Engine', 'System Service', f"Generated {len(generated)} location-specific flood alerts based on risk thresholds", {'generated_codes': generated})

    return jsonify({
        'message': f"Evaluated streets. Generated {len(generated)} new unique alerts (duplicates suppressed).",
        'new_alerts_count': len(generated),
        'generated_codes': generated
    })

@app.route('/api/alerts/<int:alert_id>/status', methods=['PUT'])
def update_alert_status(alert_id):
    data = request.json
    new_status = data.get('status', 'Acknowledged') # Active, Acknowledged, Dispatched, Resolved

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE flood_alerts SET status = ? WHERE id = ?", (new_status, alert_id))
    conn.commit()
    conn.close()

    log_activity('ALERT_STATUS_CHANGE', 'EOC Watch Officer', 'Municipal Responder', f"Updated Alert #{alert_id} status to {new_status}")

    return jsonify({'message': f"Alert status updated to {new_status}"})

# --- CITIZEN CROWDSOURCED REPORTS ---
@app.route('/api/citizen-reports', methods=['GET'])
def get_citizen_reports():
    city = request.args.get('city')
    status = request.args.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM citizen_reports WHERE 1=1"
    params = []
    if city and city != 'All Cities':
        query += " AND city = ?"
        params.append(city)
    if status and status != 'all':
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY upvotes DESC, created_at DESC"
    cursor.execute(query, params)
    reports = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        'reports': reports,
        'count': len(reports)
    })

@app.route('/api/citizen-reports', methods=['POST'])
def submit_citizen_report():
    data = request.json
    street_name = data.get('street_name')
    ward_name = data.get('ward_name', 'General Ward')
    city = data.get('city', 'Bengaluru')
    lat = float(data.get('latitude', 12.9716))
    lng = float(data.get('longitude', 77.5946))
    report_type = data.get('report_type', 'Waterlogged Road')
    water_depth = data.get('water_depth', 'Knee Deep (30-45cm)')
    description = data.get('description', '')
    citizen_name = data.get('citizen_name', 'Civic Citizen')
    phone = data.get('phone_masked', '+91 98*** **000')
    photo_url = data.get('photo_url') or "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80"

    if not street_name or not description:
        return jsonify({'error': 'street_name and description are required'}), 400

    report_code = f"CR-{city[:3].upper()}-{datetime.now().strftime('%m%d%H%M%S')}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO citizen_reports (report_code, street_name, ward_name, city, latitude, longitude, report_type, water_depth, description, citizen_name, phone_masked, photo_url, upvotes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Verified & Queued')
    ''', (report_code, street_name, ward_name, city, lat, lng, report_type, water_depth, description, citizen_name, phone, photo_url))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    log_activity('CITIZEN_REPORT_SUBMITTED', citizen_name, 'Citizen', f"Citizen reported {report_type} ({water_depth}) at {street_name}, {city}")

    return jsonify({
        'message': 'Citizen report recorded successfully',
        'report_code': report_code,
        'id': new_id
    }), 201

@app.route('/api/citizen-reports/<int:report_id>/upvote', methods=['POST'])
def upvote_citizen_report(report_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE citizen_reports SET upvotes = upvotes + 1 WHERE id = ?", (report_id,))
    cursor.execute("SELECT upvotes FROM citizen_reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.commit()
    conn.close()

    if not row:
        return jsonify({'error': 'Report not found'}), 404

    return jsonify({'message': 'Upvoted successfully', 'upvotes': row['upvotes']})

@app.route('/api/citizen-reports/<int:report_id>/status', methods=['PUT'])
def update_report_status(report_id):
    data = request.json
    new_status = data.get('status', 'Verified & Queued')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE citizen_reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (new_status, report_id))
    conn.commit()
    conn.close()

    log_activity('REPORT_STATUS_UPDATED', 'Ward Officer', 'Municipal Responder', f"Updated report #{report_id} status to {new_status}")

    return jsonify({'message': f"Report status changed to {new_status}"})

# --- MUNICIPAL RESPONSE & TRIAGE ---
@app.route('/api/municipal-response', methods=['GET'])
def get_municipal_responses():
    city = request.args.get('city')
    priority = request.args.get('priority')
    status = request.args.get('status')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM municipal_responses WHERE 1=1"
    params = []
    if city and city != 'All Cities':
        query += " AND city = ?"
        params.append(city)
    if priority and priority != 'all':
        query += " AND priority = ?"
        params.append(priority)
    if status and status != 'all':
        query += " AND status = ?"
        params.append(status)

    query += " ORDER BY CASE priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, created_at DESC"
    cursor.execute(query, params)
    incidents = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({
        'responses': incidents,
        'count': len(incidents)
    })

@app.route('/api/municipal-response', methods=['POST'])
def create_municipal_response():
    data = request.json
    street_id = data.get('street_id')
    street_name = data.get('street_name')
    ward_name = data.get('ward_name', 'General Ward')
    city = data.get('city', 'Bengaluru')
    priority = data.get('priority', 'High')
    assigned_team = data.get('assigned_team', 'Ward Rapid Taskforce')
    crew_lead = data.get('crew_lead', 'Duty Engineer')
    pumps = int(data.get('dewatering_pumps_deployed', 2))
    suction = int(data.get('suction_vehicles_count', 1))
    notes = data.get('resolution_notes', 'Dispatched crew with dewatering apparatus.')

    incident_code = f"INC-{datetime.now().strftime('%Y')}-{city[:3].upper()}-{datetime.now().strftime('%m%d%H%M')}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO municipal_responses (incident_code, street_id, street_name, ward_name, city, priority, assigned_team, crew_lead, dewatering_pumps_deployed, suction_vehicles_count, status, resolution_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dispatched', ?)
    ''', (incident_code, street_id, street_name, ward_name, city, priority, assigned_team, crew_lead, pumps, suction, notes))
    conn.commit()
    conn.close()

    log_activity('CREW_DISPATCHED', crew_lead, 'Municipal Responder', f"Dispatched {assigned_team} to {street_name} (Priority: {priority}, {pumps} pumps)")

    return jsonify({'message': 'Municipal incident dispatch created', 'incident_code': incident_code}), 201

@app.route('/api/municipal-response/<int:response_id>', methods=['PUT'])
def update_municipal_response(response_id):
    data = request.json
    status = data.get('status') # Dispatched, On-Site Dewatering, Completed, Closed
    resolution_notes = data.get('resolution_notes')
    pumps = data.get('dewatering_pumps_deployed')
    suction = data.get('suction_vehicles_count')

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM municipal_responses WHERE id = ?", (response_id,))
    incident = cursor.fetchone()
    if not incident:
        conn.close()
        return jsonify({'error': 'Incident not found'}), 404

    res_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S') if status in ['Completed', 'Closed'] else incident['resolution_time']

    cursor.execute('''
    UPDATE municipal_responses
    SET status = COALESCE(?, status),
        resolution_notes = COALESCE(?, resolution_notes),
        dewatering_pumps_deployed = COALESCE(?, dewatering_pumps_deployed),
        suction_vehicles_count = COALESCE(?, suction_vehicles_count),
        resolution_time = ?
    WHERE id = ?
    ''', (status, resolution_notes, pumps, suction, res_time, response_id))
    conn.commit()
    conn.close()

    log_activity('INCIDENT_UPDATED', 'EOC Command', 'Municipal Responder', f"Incident #{response_id} status updated to {status}: {resolution_notes}")

    return jsonify({'message': 'Municipal response updated successfully'})

# --- ANALYTICS & TRENDS ---
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # City-wise comparison
    cursor.execute('''
    SELECT s.city, COUNT(s.id) as street_count, AVG(d.current_blockage_pct) as avg_blockage, AVG(d.nominal_capacity_mm_hr) as avg_capacity
    FROM streets s
    LEFT JOIN drainage d ON s.id = d.street_id
    GROUP BY s.city
    ''')
    city_stats = [dict(row) for row in cursor.fetchall()]

    # Drainage types distribution
    cursor.execute('''
    SELECT drain_type, COUNT(*) as count, AVG(current_blockage_pct) as avg_blockage
    FROM drainage
    GROUP BY drain_type
    ''')
    drain_types = [dict(row) for row in cursor.fetchall()]

    # Top 5 worst drainage bottlenecks
    cursor.execute('''
    SELECT d.drain_code, d.drain_type, d.current_blockage_pct, d.silt_depth_cm, d.desilt_status, s.name as street_name, s.city
    FROM drainage d
    JOIN streets s ON d.street_id = s.id
    ORDER BY d.current_blockage_pct DESC LIMIT 6
    ''')
    bottlenecks = [dict(row) for row in cursor.fetchall()]

    # Incident resolution turnaround
    cursor.execute('''
    SELECT priority, COUNT(*) as count, SUM(dewatering_pumps_deployed) as total_pumps
    FROM municipal_responses
    GROUP BY priority
    ''')
    priority_breakdown = [dict(row) for row in cursor.fetchall()]

    conn.close()

    # Hotspot historical recurrence ranking (Indian demonstration hotspots)
    hotspots = [
        {'name': 'Silk Board Junction Underpass', 'city': 'Bengaluru', 'historical_events_year': 14, 'vulnerability_index': 94, 'primary_cause': 'Catchment valley depression & Rajakaluve throttle'},
        {'name': 'Bellandur Ecospace Service Road', 'city': 'Bengaluru', 'historical_events_year': 12, 'vulnerability_index': 92, 'primary_cause': 'Lake surplus backflow & rapid tech park concretization'},
        {'name': 'Velachery Bypass Road Basin', 'city': 'Chennai', 'historical_events_year': 11, 'vulnerability_index': 89, 'primary_cause': 'Marshland encroachment and high siltation in macro-drain'},
        {'name': 'Shivajinagar Sancheti Underpass', 'city': 'Pune', 'historical_events_year': 9, 'vulnerability_index': 82, 'primary_cause': 'Sub-grade elevation well pump capacity deficit'},
        {'name': 'Tolichowki Flyover Underpass', 'city': 'Hyderabad', 'historical_events_year': 8, 'vulnerability_index': 79, 'primary_cause': 'Shah Hatim Nala surplus weir overflow'}
    ]

    return jsonify({
        'city_stats': city_stats,
        'drainage_distribution': drain_types,
        'worst_bottlenecks': bottlenecks,
        'incident_priority_stats': priority_breakdown,
        'historical_hotspots': hotspots,
        'disclaimer': 'Analytics computed from simulated hydrological parameters and historical urban flood patterns.'
    })

# --- ACTIVITY AUDIT LOGS ---
@app.route('/api/activity-logs', methods=['GET'])
def get_activity_logs():
    limit = int(request.args.get('limit', 50))
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify({'logs': logs, 'count': len(logs)})

# --- SYSTEM SETTINGS & SCORING CALIBRATION ---
@app.route('/api/settings', methods=['GET'])
def get_system_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings")
    settings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'settings': settings})

@app.route('/api/settings', methods=['PUT'])
def update_system_settings():
    data = request.json # list of {key, value} or dict
    conn = get_db_connection()
    cursor = conn.cursor()

    if isinstance(data, list):
        for item in data:
            cursor.execute("UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?", (str(item['value']), item['key']))
    elif isinstance(data, dict):
        for key, val in data.items():
            cursor.execute("UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?", (str(val), key))

    conn.commit()
    conn.close()

    log_activity('SETTINGS_UPDATED', 'System Administrator', 'Admin', 'Updated flood-risk scoring weights & alert thresholds')

    return jsonify({'message': 'Settings updated successfully'})

# --- SIMULATION SCENARIOS (Cloudburst, Heavy Monsoon, Moderate Shower, Dry Weather) ---
@app.route('/api/simulation/apply-scenario', methods=['POST'])
def apply_simulation_scenario():
    data = request.json or {}
    scenario = data.get('scenario', 'monsoon_heavy') # dry, moderate_shower, monsoon_heavy, cloudburst

    conn = get_db_connection()
    cursor = conn.cursor()

    if scenario == 'cloudburst':
        # Extreme rain intensity 85-110 mm/hr
        cursor.execute("UPDATE rainfall_readings SET current_intensity_mm_hr = 98.5, accumulation_1h = 88.0, accumulation_3h = 145.0, forecast_next_2h_mm_hr = 105.0")
        cursor.execute("UPDATE system_settings SET setting_value = 'cloudburst' WHERE setting_key = 'simulation_scenario'")
        desc = "Triggered Catastrophic Cloudburst Scenario (98.5 mm/hr rain intensity across monitored basins)"
    elif scenario == 'monsoon_heavy':
        cursor.execute("UPDATE rainfall_readings SET current_intensity_mm_hr = 58.0, accumulation_1h = 52.0, accumulation_3h = 85.0, forecast_next_2h_mm_hr = 64.0")
        cursor.execute("UPDATE system_settings SET setting_value = 'monsoon_heavy' WHERE setting_key = 'simulation_scenario'")
        desc = "Set Active Heavy Monsoon Regime (58.0 mm/hr steady intensity with 85mm 3h accumulation)"
    elif scenario == 'moderate_shower':
        cursor.execute("UPDATE rainfall_readings SET current_intensity_mm_hr = 24.0, accumulation_1h = 20.0, accumulation_3h = 35.0, forecast_next_2h_mm_hr = 18.0")
        cursor.execute("UPDATE system_settings SET setting_value = 'moderate_shower' WHERE setting_key = 'simulation_scenario'")
        desc = "Set Moderate Intermittent Shower Regime (24.0 mm/hr)"
    else: # dry
        cursor.execute("UPDATE rainfall_readings SET current_intensity_mm_hr = 0.0, accumulation_1h = 2.0, accumulation_3h = 5.0, forecast_next_2h_mm_hr = 0.0")
        cursor.execute("UPDATE system_settings SET setting_value = 'dry' WHERE setting_key = 'simulation_scenario'")
        desc = "Set Dry Weather Baseline (0.0 mm/hr rain, baseline drainage clearance)"

    conn.commit()
    conn.close()

    log_activity('SIMULATION_SCENARIO_CHANGED', 'Simulation Controller', 'System Admin', desc, {'scenario': scenario})

    return jsonify({
        'message': f"Simulation scenario '{scenario}' applied successfully.",
        'scenario': scenario,
        'description': desc
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
