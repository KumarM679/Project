"""
Seed data generator with realistic Indian civic-tech demonstration records.
Cities included: Bengaluru, Hyderabad, Chennai, Pune, Vijayawada, Mysuru.
All data is clearly marked as demonstration / simulation records.
"""

from database import get_db_connection

def seed_all():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM streets")
    cursor.execute("DELETE FROM drainage")
    cursor.execute("DELETE FROM rainfall_readings")
    cursor.execute("DELETE FROM flood_alerts")
    cursor.execute("DELETE FROM citizen_reports")
    cursor.execute("DELETE FROM municipal_responses")
    cursor.execute("DELETE FROM activity_logs")
    cursor.execute("DELETE FROM system_settings")

    # 1. Streets
    streets_data = [
        # Bengaluru
        ("Silk Board Junction Low-Lying Underpass", "Bengaluru", "BTM Layout", "Ward 176", 12.9172, 77.6228, "Arterial Junction", 0.92, 0.4, 850, 908.0, 68000, "High"),
        ("Outer Ring Road - Bellandur Ecospace Stretch", "Bengaluru", "Bellandur", "Ward 150", 12.9260, 77.6834, "Tech Corridor", 0.95, 0.3, 1400, 895.0, 92000, "High"),
        ("Manyata Tech Park Flyover Down-Ramp", "Bengaluru", "Nagavara", "Ward 023", 13.0475, 77.6200, "Arterial", 0.88, 0.5, 950, 915.0, 54000, "Moderate"),
        ("Shantinagar Double Road (KSRTC Bus Depot)", "Bengaluru", "Shantinagar", "Ward 117", 12.9568, 77.5954, "Major Radial", 0.86, 0.6, 720, 912.0, 48000, "Moderate"),
        ("Richmond Road Flyover Underpass", "Bengaluru", "Shanthala Nagar", "Ward 111", 12.9660, 77.6042, "Grade-Separated Underpass", 0.94, 0.3, 400, 906.0, 31000, "High"),
        ("Koramangala 80 Feet Road (Near 4th Block)", "Bengaluru", "Koramangala", "Ward 151", 12.9345, 77.6272, "Commercial Collector", 0.84, 0.8, 1100, 902.0, 42000, "Moderate"),
        ("Sony World Junction Catchment", "Bengaluru", "Ejipura", "Ward 148", 12.9378, 77.6288, "Collector Road", 0.89, 0.5, 650, 900.0, 38000, "High"),
        ("Hebbal Lake Downstream Feeder Road", "Bengaluru", "Hebbal", "Ward 007", 13.0358, 77.5970, "Major Arterial", 0.83, 0.9, 1300, 918.0, 61000, "Low"),
        ("Majestic KSR Railway Underpass", "Bengaluru", "Gandhinagar", "Ward 094", 12.9772, 77.5714, "Underpass", 0.96, 0.2, 380, 916.0, 29000, "High"),
        ("Indiranagar 100ft Road (12th Main Crossing)", "Bengaluru", "Indiranagar", "Ward 112", 12.9719, 77.6412, "Commercial Arterial", 0.82, 1.4, 1600, 922.0, 52000, "Low"),

        # Hyderabad
        ("Madhapur Hitec City Cyber Towers Junction", "Hyderabad", "Madhapur", "Circle 20", 17.4504, 78.3808, "Major IT Corridor", 0.91, 0.7, 1200, 542.0, 74000, "Moderate"),
        ("Tolichowki Flyover Underpass Basin", "Hyderabad", "Tolichowki", "Circle 13", 17.3995, 78.4140, "Major Arterial Underpass", 0.93, 0.4, 800, 510.0, 62000, "High"),
        ("Begumpet Shyamlal Building Road", "Hyderabad", "Begumpet", "Circle 18", 17.4442, 78.4682, "Arterial Road", 0.87, 0.6, 950, 525.0, 49000, "Moderate"),
        ("Gachibowli Outer Ring Road Slip Road", "Hyderabad", "Gachibowli", "Circle 19", 17.4362, 78.3582, "Highway Slip Lane", 0.85, 1.2, 1500, 560.0, 58000, "Low"),

        # Chennai
        ("Velachery Bypass Road (Near Vijayanagar)", "Chennai", "Velachery", "Zone 13", 12.9815, 80.2180, "Arterial Canal Basin", 0.93, 0.3, 1100, 6.0, 89000, "High"),
        ("T Nagar Usman Road Flyover Base", "Chennai", "T. Nagar", "Zone 10", 13.0418, 80.2342, "High-Density Commercial", 0.96, 0.4, 750, 11.0, 53000, "High"),
        ("Koyambedu Wholesale Market Link Road", "Chennai", "Koyambedu", "Zone 08", 13.0694, 80.1948, "Freight Corridor", 0.89, 0.5, 1300, 14.0, 71000, "Moderate"),
        ("Madipakkam Main Road Low Depression", "Chennai", "Madipakkam", "Zone 14", 12.9642, 80.1989, "Residential Collector", 0.84, 0.4, 820, 8.0, 46000, "High"),

        # Pune
        ("Shivajinagar Sancheti Hospital Underpass", "Pune", "Shivajinagar", "Prabhag 07", 18.5314, 73.8446, "Underpass Basin", 0.95, 0.3, 420, 558.0, 34000, "High"),
        ("Swargate Chowk Sub-Grade Connector", "Pune", "Swargate", "Prabhag 19", 18.5018, 73.8586, "Transit Hub", 0.90, 0.6, 680, 564.0, 48000, "Moderate"),
        ("Hinjewadi Phase 1 Circle", "Pune", "Hinjewadi", "Prabhag 02", 18.5912, 73.7389, "IT Expressway", 0.86, 1.1, 1400, 575.0, 63000, "Low"),

        # Vijayawada
        ("Benz Circle Underpass Crossing", "Vijayawada", "Benz Circle", "Ward 12", 16.4971, 80.6548, "Arterial Intersection", 0.92, 0.4, 700, 22.0, 45000, "High"),
        ("MG Road (Bandar Road) Commercial Corridor", "Vijayawada", "Governorpet", "Ward 08", 16.5122, 80.6276, "Commercial Arterial", 0.88, 0.7, 1200, 24.0, 51000, "Moderate"),
        ("One Town Canal Bank Relief Road", "Vijayawada", "One Town", "Ward 03", 16.5186, 80.6120, "Canal Basin Road", 0.85, 0.5, 850, 19.0, 39000, "High"),

        # Mysuru
        ("Sayyaji Rao Road Heritage Corridor", "Mysuru", "Mandi Mohalla", "Ward 22", 12.3168, 76.6508, "Heritage Arterial", 0.82, 0.8, 900, 768.0, 37000, "Low"),
        ("D. Devaraj Urs Road Shopping Precinct", "Mysuru", "Subbarayanakere", "Ward 25", 12.3075, 76.6455, "Commercial Collector", 0.85, 0.6, 750, 772.0, 33000, "Moderate"),
        ("Kuvempunagar Double Road Low Point", "Mysuru", "Kuvempunagar", "Ward 48", 12.2882, 76.6278, "Residential Arterial", 0.80, 1.2, 1100, 780.0, 42000, "Low"),
    ]

    cursor.executemany('''
    INSERT INTO streets (name, city, ward_name, ward_no, latitude, longitude, road_type, surface_imperviousness, slope_gradient, length_meters, elevation_meters, catchment_area_sqm, baseline_risk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', streets_data)

    conn.commit()

    # Retrieve inserted street IDs
    cursor.execute("SELECT id, name, city FROM streets")
    street_rows = cursor.fetchall()
    street_map = {row['name']: row['id'] for row in street_rows}

    # 2. Drainage Network Records
    drainage_data = [
        # Silk Board
        (street_map.get("Silk Board Junction Low-Lying Underpass"), "DRN-BLR-001", "RCC Box Storm Drain (Primary SWD)", 48.0, 68.0, 26.0, "Fair", "2026-10-14", "Overdue", "BBMP South QRT-3", "Madiwala Lake Overflow Conduit"),
        # Bellandur Ecospace
        (street_map.get("Outer Ring Road - Bellandur Ecospace Stretch"), "DRN-BLR-002", "Open Masonry Rajakaluve Channel", 65.0, 72.0, 32.0, "Degraded", "2026-10-18", "Overdue", "Mahadevapura Stormwater Wing", "Bellandur Lake Primary Inflow"),
        # Manyata
        (street_map.get("Manyata Tech Park Flyover Down-Ramp"), "DRN-BLR-003", "Twin Precast Box Drain", 55.0, 35.0, 14.0, "Good", "2026-10-21", "Recent", "Byatarayanapura Division", "Nagavara Lake Feeder Canal"),
        # Shantinagar
        (street_map.get("Shantinagar Double Road (KSRTC Bus Depot)"), "DRN-BLR-004", "Brick Arch Historic SWD Conduit", 42.0, 48.0, 19.0, "Fair", "2026-10-09", "Due", "East Zone Desilting Unit", "Koramangala Valley Trunk Drain"),
        # Richmond Road
        (street_map.get("Richmond Road Flyover Underpass"), "DRN-BLR-005", "Sump Pump & Catch Basin Grid", 38.0, 75.0, 28.0, "Fair", "2026-10-11", "Overdue", "Central Ward Dewatering Cell", "Langford Town Storm Outfall"),
        # Koramangala 80ft
        (street_map.get("Koramangala 80 Feet Road (Near 4th Block)"), "DRN-BLR-006", "Covered RCC Collector Drain", 50.0, 30.0, 12.0, "Good", "2026-10-22", "Recent", "South Zone Rapid Cell", "Koramangala Valley Rajakaluve"),
        # Sony World
        (street_map.get("Sony World Junction Catchment"), "DRN-BLR-007", "Secondary Feeder Lateral", 36.0, 58.0, 22.0, "Fair", "2026-10-15", "Due", "Ejipura Maintenance Gang", "Ejipura Canal Outfall"),
        # Hebbal
        (street_map.get("Hebbal Lake Downstream Feeder Road"), "DRN-BLR-008", "Deep Open Trapezoidal Drain", 80.0, 15.0, 6.0, "Good", "2026-10-24", "Recent", "Hebbal Lake Authority Link", "Hebbal Lake Sluice Channel"),
        # Majestic
        (street_map.get("Majestic KSR Railway Underpass"), "DRN-BLR-009", "Automated Sump Well & Dual Pumps", 34.0, 80.0, 31.0, "Degraded", "2026-10-08", "Overdue", "West Zone QRT", "Vrishabhavathi Valley Trunk"),
        # Indiranagar
        (street_map.get("Indiranagar 100ft Road (12th Main Crossing)"), "DRN-BLR-010", "Roadside Perforated Curb Drain", 58.0, 18.0, 7.0, "Good", "2026-10-25", "Recent", "East Zone Maintenance Cell", "Ulsoor Lake Catchment Interceptor"),

        # Hyderabad
        (street_map.get("Madhapur Hitec City Cyber Towers Junction"), "DRN-HYD-001", "RCC Box Storm Drain", 52.0, 42.0, 16.0, "Good", "2026-10-19", "Due", "GHMC Serilingampally Wing", "Durgam Cheruvu Inflow"),
        (street_map.get("Tolichowki Flyover Underpass Basin"), "DRN-HYD-002", "Underpass Sump & Dual RCC Lateral", 40.0, 70.0, 27.0, "Fair", "2026-10-12", "Overdue", "GHMC Khairatabad Zone", "Shah Hatim Lake Drainage Nala"),
        (street_map.get("Begumpet Shyamlal Building Road"), "DRN-HYD-003", "Covered Nala Main Drain", 56.0, 38.0, 15.0, "Good", "2026-10-20", "Recent", "GHMC Secunderabad Division", "Hussain Sagar Surplus Nala"),
        (street_map.get("Gachibowli Outer Ring Road Slip Road"), "DRN-HYD-004", "Open Shoulder Swale Drain", 68.0, 12.0, 5.0, "Good", "2026-10-24", "Recent", "TSIIC Maintenance Division", "Nanakramguda Infiltration Pond"),

        # Chennai
        (street_map.get("Velachery Bypass Road (Near Vijayanagar)"), "DRN-MAA-001", "RCC Box Macro-Drain", 60.0, 76.0, 35.0, "Degraded", "2026-10-16", "Overdue", "GCC Zone 13 Stormwater Cell", "Pallikaranai Marshland Channel"),
        (street_map.get("T Nagar Usman Road Flyover Base"), "DRN-MAA-002", "Deep Micro-Tunnel Drain", 45.0, 64.0, 24.0, "Fair", "2026-10-13", "Due", "GCC Kodambakkam Rapid Crew", "Mambalam Canal Outfall"),
        (street_map.get("Koyambedu Wholesale Market Link Road"), "DRN-MAA-003", "Twin Box Storm Channel", 58.0, 36.0, 14.0, "Good", "2026-10-22", "Recent", "GCC Central Zone Wing", "Cooum River Lateral Branch"),
        (street_map.get("Madipakkam Main Road Low Depression"), "DRN-MAA-004", "Earthen Open Collector Drain", 35.0, 78.0, 30.0, "Degraded", "2026-10-10", "Overdue", "GCC South Rapid Squad", "Madipakkam Lake Overflow"),

        # Pune
        (street_map.get("Shivajinagar Sancheti Hospital Underpass"), "DRN-PNQ-001", "Submersible Pump Well & 1200mm Pipe", 36.0, 74.0, 28.0, "Fair", "2026-10-17", "Overdue", "PMC Shivajinagar Ward Cell", "Mutha River Relief Line"),
        (street_map.get("Swargate Chowk Sub-Grade Connector"), "DRN-PNQ-002", "RCC Stormwater Trunk", 52.0, 44.0, 18.0, "Good", "2026-10-20", "Due", "PMC Swargate Response Team", "Ambil Odha Channel"),
        (street_map.get("Hinjewadi Phase 1 Circle"), "DRN-PNQ-003", "Precast Roadside Trench", 64.0, 20.0, 8.0, "Good", "2026-10-23", "Recent", "MIDC Hinjewadi Ops", "Mula River Secondary Branch"),

        # Vijayawada
        (street_map.get("Benz Circle Underpass Crossing"), "DRN-VJA-001", "Dual Storm Pipe & Sump Pit", 42.0, 66.0, 25.0, "Fair", "2026-10-15", "Overdue", "VMC Circle-2 Engineering Gang", "Ryves Canal Interceptor"),
        (street_map.get("MG Road (Bandar Road) Commercial Corridor"), "DRN-VJA-002", "Side RCC Covered Conduit", 54.0, 34.0, 13.0, "Good", "2026-10-21", "Recent", "VMC Central Maintenance", "Eluru Canal Outfall"),
        (street_map.get("One Town Canal Bank Relief Road"), "DRN-VJA-003", "Canal Retaining Wall Weepholes & Trench", 38.0, 60.0, 23.0, "Fair", "2026-10-18", "Due", "VMC One Town Response Squad", "Krishna River Surplus Weir"),

        # Mysuru
        (street_map.get("Sayyaji Rao Road Heritage Corridor"), "DRN-MYS-001", "Stone Slabs Covered Drain", 46.0, 22.0, 9.0, "Good", "2026-10-23", "Recent", "MCC Zone 6 Maintenance", "Karanji Lake Overflow Branch"),
        (street_map.get("D. Devaraj Urs Road Shopping Precinct"), "DRN-MYS-002", "Masonry Kerb Channel", 48.0, 36.0, 15.0, "Good", "2026-10-19", "Recent", "MCC Zone 4 Field Gang", "Kukkarahalli Feeder"),
        (street_map.get("Kuvempunagar Double Road Low Point"), "DRN-MYS-003", "RCC Pipe Line & Catch Pits", 56.0, 18.0, 7.0, "Good", "2026-10-25", "Recent", "MCC South Zone Crew", "Lingambudhi Catchment")
    ]

    for item in drainage_data:
        if item[0]:
            cursor.execute('''
            INSERT INTO drainage (street_id, drain_code, drain_type, nominal_capacity_mm_hr, current_blockage_pct, silt_depth_cm, structural_status, last_inspected, desilt_status, maintenance_crew, discharge_outfall)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', item)

    conn.commit()

    # 3. Rainfall Telemetry Readings
    rainfall_data = [
        ("Bengaluru", "AWS-BLR-01", "Central KSNDMC-BBMP Telemetry Hub", 54.5, 48.0, 82.0, 114.0, 142.0, 62.0, "Operational", "Doppler Radar & Automatic Weather Station"),
        ("Bengaluru", "AWS-BLR-02", "Bellandur Basin Telemetry Radar", 68.0, 61.0, 98.0, 130.0, 168.0, 75.0, "Operational", "AWS Pluviometer Micro-Station"),
        ("Bengaluru", "AWS-BLR-03", "Nagavara-Hebbal Basin Telemetry", 42.0, 35.0, 58.0, 79.0, 102.0, 48.0, "Operational", "Smart City Telemetry Node"),
        ("Hyderabad", "AWS-HYD-01", "GHMC Cyberabad Hydro-Met Station", 46.0, 38.0, 64.0, 85.0, 112.0, 52.0, "Operational", "IMD AWS & Urban Flood Sensor"),
        ("Hyderabad", "AWS-HYD-02", "Charminar-Tolichowki Basin Sensor", 62.0, 53.0, 88.0, 118.0, 145.0, 68.0, "Operational", "GHMC DRF Telemetry Unit"),
        ("Chennai", "AWS-MAA-01", "GCC Velachery Lake Macro Basin AWS", 72.5, 66.0, 115.0, 154.0, 198.0, 80.0, "Operational", "Doppler Weather Radar (IMD Chennai)"),
        ("Chennai", "AWS-MAA-02", "T. Nagar Urban Flood Telemetry", 58.0, 49.0, 84.0, 108.0, 136.0, 64.0, "Operational", "GCC Automated Rain Gauge"),
        ("Pune", "AWS-PNQ-01", "PMC Shivajinagar IMD Observatory", 50.0, 42.0, 70.0, 92.0, 118.0, 55.0, "Operational", "Urban Hydrology Rain Station"),
        ("Pune", "AWS-PNQ-02", "Hinjewadi IT Corridor Micro-AWS", 28.0, 22.0, 38.0, 49.0, 62.0, 32.0, "Operational", "MIDC Sensor Mesh"),
        ("Vijayawada", "AWS-VJA-01", "VMC Benz Circle Hydro Sensor", 64.0, 56.0, 92.0, 122.0, 150.0, 70.0, "Operational", "State Disaster Ops Pluviometer"),
        ("Mysuru", "AWS-MYS-01", "MCC Chamundi Foothills AWS", 24.0, 18.0, 32.0, 44.0, 58.0, 26.0, "Operational", "Karnataka State Natural Disaster Monitor")
    ]

    cursor.executemany('''
    INSERT INTO rainfall_readings (city, station_code, station_name, current_intensity_mm_hr, accumulation_1h, accumulation_3h, accumulation_6h, accumulation_24h, forecast_next_2h_mm_hr, sensor_status, data_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', rainfall_data)

    conn.commit()

    # 4. Citizen Crowdsource Reports
    citizen_reports_data = [
        ("CR-BLR-901", "Silk Board Junction Low-Lying Underpass", "BTM Layout", "Bengaluru", 12.9175, 77.6231, "Waterlogged Road", "Waist Deep (60-80cm)", "Underpass has 2.5 feet of stagnant rainwater. Two city buses stalled. Traffic backed up till Hosur Road flyover.", "Ramesh Gowda", "+91 98450 **812", "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80", 42, "Crew Dispatched"),
        ("CR-BLR-902", "Outer Ring Road - Bellandur Ecospace Stretch", "Bellandur", "Bengaluru", 12.9263, 77.6839, "Waterlogged Road", "Knee Deep (30-45cm)", "Service road completely submerged outside Ecospace Tech Park gate 2. Techies wading through muddy water. Storm drain overflowing.", "Ananya Sharma", "+91 99001 **654", "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80", 67, "Crew Dispatched"),
        ("CR-BLR-903", "Richmond Road Flyover Underpass", "Shanthala Nagar", "Bengaluru", 12.9662, 77.6045, "Blocked Drain", "Knee Deep (30-45cm)", "Catch basin gratings choked with single-use plastic waste and wet tree branches. Inflow completely obstructed.", "Karthik Raja", "+91 97412 **339", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", 19, "Verified & Queued"),
        ("CR-BLR-904", "Majestic KSR Railway Underpass", "Gandhinagar", "Bengaluru", 12.9775, 77.5718, "Waterlogged Road", "Waist Deep (60-80cm)", "Auto-rickshaw trapped in 3 feet deep water. High power pump in underpass sump appears tripped.", "Syed Irfan", "+91 94481 **201", "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80", 55, "Crew Dispatched"),
        ("CR-MAA-401", "Velachery Bypass Road (Near Vijayanagar)", "Velachery", "Chennai", 12.9818, 80.2185, "Waterlogged Road", "Waist Deep (60-80cm)", "Water entering ground floor shops near bus stop. Lake surplus channel is backflowing onto road.", "Sundaram V.", "+91 98402 **991", "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80", 84, "Crew Dispatched"),
        ("CR-MAA-402", "T Nagar Usman Road Flyover Base", "T. Nagar", "Chennai", 13.0421, 80.2346, "Blocked Drain", "Ankle Deep (10-15cm)", "Construction debris from store renovation clogging roadside drain chambers.", "K. Meenakshi", "+91 94440 **711", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", 14, "Verified & Queued"),
        ("CR-HYD-501", "Tolichowki Flyover Underpass Basin", "Tolichowki", "Hyderabad", 17.3998, 78.4144, "Waterlogged Road", "Knee Deep (30-45cm)", "Heavy water accumulation under flyover. Two wheelers skidding. Needs immediate suction tanker.", "Mirza Baig", "+91 98850 **442", "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80", 38, "Crew Dispatched"),
        ("CR-PNQ-201", "Shivajinagar Sancheti Hospital Underpass", "Shivajinagar", "Pune", 18.5317, 73.8449, "Waterlogged Road", "Knee Deep (30-45cm)", "Underpass closed by traffic police. Water depth approximately 40cm. Drainage sump capacity overwhelmed.", "Sachin Deshmukh", "+91 98220 **518", "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80", 29, "Verified & Queued"),
        ("CR-VJA-101", "Benz Circle Underpass Crossing", "Benz Circle", "Vijayawada", 16.4974, 80.6551, "Waterlogged Road", "Ankle Deep (10-15cm)", "Slow drain outflow causing 15cm puddle spanning 200 meters. Slow movement toward Bandar road.", "Chaitanya Raju", "+91 98480 **123", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", 11, "Verified & Queued")
    ]

    cursor.executemany('''
    INSERT INTO citizen_reports (report_code, street_name, ward_name, city, latitude, longitude, report_type, water_depth, description, citizen_name, phone_masked, photo_url, upvotes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', citizen_reports_data)

    conn.commit()

    # 5. Flood Alerts
    alerts_data = [
        (
            "ALT-BLR-2026-001",
            street_map.get("Silk Board Junction Low-Lying Underpass"),
            "Silk Board Junction Low-Lying Underpass",
            "BTM Layout",
            "Bengaluru",
            "red",
            89.4,
            "CRITICAL FLOOD RISK: Silk Board Low-Lying Underpass",
            "Runoff rate (74 mm/hr) substantially exceeds obstructed drain capacity (13 mm/hr). Inundation depth exceeding 45cm.",
            "Avoid underpass route. Divert traffic via 16th Main Koramangala or Madiwala flyover. Deploy high-capacity dewatering pumps immediately.",
            "Active",
            "Citizens & Emergency Responders",
            "BLR-SILKBOARD-2026-10-26"
        ),
        (
            "ALT-BLR-2026-002",
            street_map.get("Outer Ring Road - Bellandur Ecospace Stretch"),
            "Outer Ring Road - Bellandur Ecospace Stretch",
            "Bellandur",
            "Bengaluru",
            "red",
            92.1,
            "CRITICAL FLOOD RISK: Bellandur Ecospace Tech Corridor",
            "Severe Rajakaluve backflow compounded by 72% silt choke and 68 mm/hr rainfall intensity. Water spilling across outer service lanes.",
            "Advise tech parks to stagger office exits. Restrict light vehicles from outer lanes. Deploy crawler excavators to clear outfall blockages.",
            "Active",
            "Citizens & Municipal Responders",
            "BLR-BELLANDUR-2026-10-26"
        ),
        (
            "ALT-MAA-2026-001",
            street_map.get("Velachery Bypass Road (Near Vijayanagar)"),
            "Velachery Bypass Road (Near Vijayanagar)",
            "Velachery",
            "Chennai",
            "red",
            88.6,
            "CRITICAL WATERLOGGING: Velachery Bypass Corridor",
            "Macro canal outfall choked with 76% sediment barrier. Rain intensity 72.5 mm/hr creating 50cm street ponding.",
            "Divert bus routes toward Inner Ring Road. Mobilize GCC heavy diesel suction pumps and barrier buoys.",
            "Active",
            "Emergency Operations Command & Public",
            "MAA-VELACHERY-2026-10-26"
        ),
        (
            "ALT-BLR-2026-003",
            street_map.get("Majestic KSR Railway Underpass"),
            "Majestic KSR Railway Underpass",
            "Gandhinagar",
            "Bengaluru",
            "red",
            84.2,
            "SEVERE INUNDATION: Majestic KSR Railway Underpass",
            "Underpass sump pump tripped. 80% drain blockage. Water height 60cm, impassable for cars and 2-wheelers.",
            "Underpass temporarily barricaded by traffic police. Electrical crew resetting automatic starter panel.",
            "Active",
            "Traffic Police & QRT",
            "BLR-MAJESTIC-2026-10-26"
        ),
        (
            "ALT-HYD-2026-001",
            street_map.get("Tolichowki Flyover Underpass Basin"),
            "Tolichowki Flyover Underpass Basin",
            "Tolichowki",
            "Hyderabad",
            "orange",
            77.8,
            "HIGH RISK ADVISORY: Tolichowki Underpass Catchment",
            "Rainfall rate 62 mm/hr approaching drainage limit. Water accumulation 25-35cm expected within 30 minutes.",
            "Commuters advised to use elevated flyover instead of ground underpass. GHMC DRF unit positioned.",
            "Active",
            "Citizens & Traffic Police",
            "HYD-TOLICHOWKI-2026-10-26"
        ),
        (
            "ALT-PNQ-2026-001",
            street_map.get("Shivajinagar Sancheti Hospital Underpass"),
            "Shivajinagar Sancheti Hospital Underpass",
            "Shivajinagar",
            "Pune",
            "orange",
            74.5,
            "HIGH RISK ADVISORY: Shivajinagar Sancheti Underpass",
            "Drainage capacity exceeded due to 74% silt accumulation. 30cm waterlogged stretch reported.",
            "Traffic diverted via Pune University road. PMC dewatering pump engine activated.",
            "Active",
            "Ward Responders & Citizens",
            "PNQ-SHIVAJINAGAR-2026-10-26"
        ),
        (
            "ALT-VJA-2026-001",
            street_map.get("Benz Circle Underpass Crossing"),
            "Benz Circle Underpass Crossing",
            "Benz Circle",
            "Vijayawada",
            "orange",
            71.2,
            "HIGH RISK ADVISORY: Benz Circle Underpass Junction",
            "Intense shower (64 mm/hr) exceeding secondary drain throughput. Slow drain discharge.",
            "VMC quick response team on site clearing surface inlet gratings.",
            "Active",
            "Citizens & Municipal Engineering",
            "VJA-BENZCIRCLE-2026-10-26"
        ),
        (
            "ALT-BLR-2026-004",
            street_map.get("Manyata Tech Park Flyover Down-Ramp"),
            "Manyata Tech Park Flyover Down-Ramp",
            "Nagavara",
            "Bengaluru",
            "yellow",
            48.7,
            "MODERATE RISK WATCH: Manyata Tech Park Down-Ramp",
            "Rainfall accumulation 35 mm/hr with 35% curb drain blockage. Localized gutter pooling along left lane.",
            "Reduce vehicular speed to 25 km/h. BBMP sweeper team clearing leaf litter.",
            "Active",
            "Citizens & Ward Commuters",
            "BLR-MANYATA-2026-10-26"
        )
    ]

    for item in alerts_data:
        if item[1]:
            cursor.execute('''
            INSERT INTO flood_alerts (alert_code, street_id, street_name, ward_name, city, severity, risk_score, title, message, recommendation, status, target_audience, deduplication_key)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', item)

    conn.commit()

    # 6. Municipal Responses
    municipal_responses_data = [
        (
            "INC-2026-BLR-01",
            street_map.get("Silk Board Junction Low-Lying Underpass"),
            "Silk Board Junction Low-Lying Underpass",
            "BTM Layout",
            "Bengaluru",
            "Critical",
            "BBMP South Quick Response Team Alpha",
            "Asst. Exec. Engineer Praveen Kumar",
            40.0,
            3,
            2,
            "On-Site Dewatering",
            "Three 40HP diesel pumps deployed. Two super-sucker vehicles clearing silt at inlet culvert. Water level receding by 5cm every 15 min.",
            "Executive Engineer Rameshwar"
        ),
        (
            "INC-2026-BLR-02",
            street_map.get("Outer Ring Road - Bellandur Ecospace Stretch"),
            "Outer Ring Road - Bellandur Ecospace Stretch",
            "Bellandur",
            "Bengaluru",
            "Critical",
            "Mahadevapura Stormwater Taskforce",
            "Divisional Engineer S. Manjunath",
            50.0,
            4,
            3,
            "Dispatched",
            "Excavator deployed to demolish illegal debris bund restricting Rajakaluve outflow into Bellandur lake. Traffic police managing single lane traffic.",
            "Chief Engineer Storm Water Drains"
        ),
        (
            "INC-2026-MAA-01",
            street_map.get("Velachery Bypass Road (Near Vijayanagar)"),
            "Velachery Bypass Road (Near Vijayanagar)",
            "Velachery",
            "Chennai",
            "Critical",
            "GCC Disaster Response Force Unit 4",
            "Zonal Officer T. Anbazhagan",
            45.0,
            4,
            2,
            "On-Site Dewatering",
            "Four high-flow flood pumps operational along bypass culvert. Sandbag dykes placed along low boundary walls to prevent shop flooding.",
            "Zonal Deputy Commissioner"
        ),
        (
            "INC-2026-HYD-01",
            street_map.get("Tolichowki Flyover Underpass Basin"),
            "Tolichowki Flyover Underpass Basin",
            "Tolichowki",
            "Hyderabad",
            "High",
            "GHMC Disaster Response Force (DRF)",
            "Team Lead Mohammed Farooq",
            25.0,
            2,
            1,
            "On-Site Dewatering",
            "Two high-pressure jetting machines deployed to flush polythene blockages in 900mm pipeline. Drain capacity restored to 60%.",
            "Superintending Engineer Khairatabad"
        ),
        (
            "INC-2026-BLR-03",
            street_map.get("Majestic KSR Railway Underpass"),
            "Majestic KSR Railway Underpass",
            "Gandhinagar",
            "Bengaluru",
            "Critical",
            "BBMP West Rapid Action Gang",
            "Junior Engineer Girish N.",
            30.0,
            2,
            1,
            "On-Site Dewatering",
            "Pump control panel repaired; electrical line re-energized. Submersible pump pumping at 120,000 litres/hour. Auto-rickshaw safely towed.",
            "Asst. Commissioner West Zone"
        ),
        (
            "INC-2026-PNQ-01",
            street_map.get("Shivajinagar Sancheti Hospital Underpass"),
            "Shivajinagar Sancheti Hospital Underpass",
            "Shivajinagar",
            "Pune",
            "High",
            "PMC Emergency Dewatering Squad",
            "Junior Engineer Sanjay Patil",
            20.0,
            2,
            1,
            "Dispatched",
            "En route with 2 mobile tractor-mounted dewatering units. Police have sealed ramp entry.",
            "Ward Officer Shivajinagar"
        )
    ]

    for item in municipal_responses_data:
        if item[1]:
            cursor.execute('''
            INSERT INTO municipal_responses (incident_code, street_id, street_name, ward_name, city, priority, assigned_team, crew_lead, pump_capacity_hp, dewatering_pumps_deployed, suction_vehicles_count, status, resolution_notes, verified_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', item)

    conn.commit()

    # 7. Activity Audit Logs
    audit_data = [
        ("ALERT_GENERATED", "Nowcasting Rule Engine", "System Service", "Generated Critical Flood Alert (ALT-BLR-2026-001) for Silk Board Low-Lying Underpass with Risk Score 89.4", "127.0.0.1", '{"risk_score": 89.4, "severity": "red"}'),
        ("INCIDENT_DISPATCHED", "EOC Commander Sharma", "Municipal Officer", "Dispatched BBMP South QRT-Alpha to Silk Board Underpass with 3 diesel dewatering pumps", "192.168.1.104", '{"team": "BBMP South QRT-Alpha", "pumps": 3}'),
        ("CITIZEN_REPORT_FILED", "Ananya Sharma", "Citizen", "Logged waterlogged road report (CR-BLR-902) at Bellandur Ecospace stretch with Knee Deep rating", "49.206.12.8", '{"depth": "Knee Deep", "upvotes": 67}'),
        ("DRAIN_STATUS_UPDATED", "Inspector Venkatesh", "Ward Engineer", "Updated desilt status for DRN-BLR-002 (Bellandur Rajakaluve) to Overdue (72% blockage, 32cm silt)", "192.168.1.115", '{"blockage_pct": 72, "silt_cm": 32}'),
        ("SCORING_WEIGHTS_ADJUSTED", "Admin Kumar", "System Administrator", "Calibrated rainfall weight to 0.35 and drainage deficit weight to 0.30 for SW-Monsoon regime", "10.0.12.44", '{"rainfall_weight": 0.35, "drainage_weight": 0.30}'),
        ("ALERT_BROADCAST", "NDMA Integrated Alert Gate", "Automated Dispatch", "Pushed location-specific advisory to 14,200 registered citizens in Bellandur & Silk Board wards", "10.0.2.1", '{"target_wards": ["Ward 150", "Ward 176"]}')
    ]

    cursor.executemany('''
    INSERT INTO activity_logs (event_type, actor, role, description, ip_address, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', audit_data)

    # 8. System Settings
    settings_data = [
        ("rainfall_weight", "0.35", "Weight assigned to rainfall intensity and 1-3h antecedent accumulation", "scoring_engine"),
        ("drainage_deficit_weight", "0.30", "Weight assigned to capacity deficit (effective rainfall minus net drain capacity)", "scoring_engine"),
        ("blockage_weight", "0.15", "Weight assigned to drain silt level and debris obstruction percentage", "scoring_engine"),
        ("impervious_slope_weight", "0.12", "Weight assigned to surface imperviousness and terrain depression slope", "scoring_engine"),
        ("crowd_report_weight", "0.08", "Weight assigned to real-time citizen waterlogging confirmations", "scoring_engine"),
        ("threshold_yellow", "30.0", "Risk score threshold to trigger Moderate Flood Risk (Yellow)", "alert_thresholds"),
        ("threshold_orange", "55.0", "Risk score threshold to trigger High Flood Risk (Orange)", "alert_thresholds"),
        ("threshold_red", "80.0", "Risk score threshold to trigger Severe/Critical Flood Risk (Red)", "alert_thresholds"),
        ("alert_dedup_hours", "3", "Cooldown period in hours to avoid duplicate alerts for the same street", "alert_thresholds"),
        ("simulation_scenario", "monsoon_heavy", "Active meteorological scenario (dry, moderate_shower, monsoon_heavy, cloudburst)", "simulation")
    ]

    cursor.executemany('''
    INSERT INTO system_settings (setting_key, setting_value, description, category)
    VALUES (?, ?, ?, ?)
    ''', settings_data)

    conn.commit()
    conn.close()
    print("Seed data successfully populated!")

if __name__ == "__main__":
    from database import init_db
    init_db()
    seed_all()
