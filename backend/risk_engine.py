"""
Urban Flood Nowcasting System - Street-Level Flood Risk Scoring Engine
Combines rainfall telemetry with drainage network characteristics, catchment properties,
and crowdsourced citizen reports to calculate a 0-100 risk score with explainability factors.
"""

def calculate_street_flood_risk(street, drainage, rainfall, citizen_reports_count=0, weights=None):
    if weights is None:
        weights = {
            'rainfall_weight': 0.35,
            'drainage_deficit_weight': 0.30,
            'blockage_weight': 0.15,
            'impervious_slope_weight': 0.12,
            'crowd_report_weight': 0.08
        }

    # 1. Effective Rainfall Load (mm/hr)
    intensity = rainfall.get('current_intensity_mm_hr', 0.0) if rainfall else 0.0
    accum_1h = rainfall.get('accumulation_1h', 0.0) if rainfall else 0.0
    accum_3h = rainfall.get('accumulation_3h', 0.0) if rainfall else 0.0
    forecast_2h = rainfall.get('forecast_next_2h_mm_hr', 0.0) if rainfall else 0.0

    # Effective rainfall intensity includes antecedent saturation
    effective_rainfall = intensity + (0.35 * accum_1h) + (0.15 * min(accum_3h, 60.0)) + (0.2 * forecast_2h)

    # 2. Effective Drainage Capacity (mm/hr)
    nominal_cap = drainage.get('nominal_capacity_mm_hr', 45.0) if drainage else 35.0
    blockage_pct = drainage.get('current_blockage_pct', 15.0) if drainage else 20.0
    silt_depth = drainage.get('silt_depth_cm', 10.0) if drainage else 10.0
    structural_status = (drainage.get('structural_status', 'Good') if drainage else 'Fair').lower()

    # Structural degradation factor
    structural_mult = 1.0
    if structural_status == 'fair':
        structural_mult = 0.88
    elif structural_status == 'degraded':
        structural_mult = 0.72
    elif structural_status == 'collapsed':
        structural_mult = 0.35

    # Net drainage capacity after blockage and silt chokes
    effective_blockage = min(100.0, blockage_pct + (silt_depth * 0.8))
    effective_drainage = max(2.0, nominal_cap * (1.0 - (effective_blockage / 100.0)) * structural_mult)

    # 3. Deficit Ratio
    surplus_load = max(0.0, effective_rainfall - effective_drainage)
    deficit_ratio = surplus_load / max(10.0, effective_drainage)

    # 4. Catchment & Terrain Parameters
    imperviousness = street.get('surface_imperviousness', 0.85) if street else 0.85
    slope = street.get('slope_gradient', 1.2) if street else 1.2
    
    # Low slope (< 0.8%) means water ponds easily; high slope drains away to downslope points
    slope_ponding_penalty = 1.4 if slope < 0.6 else (1.2 if slope < 1.0 else 0.9)
    catchment_factor = imperviousness * slope_ponding_penalty

    # 5. Component Score Calculations (0 to 100 scales)
    # Rainfall intensity score
    rainfall_score = min(100.0, (effective_rainfall / 70.0) * 100.0)
    
    # Drainage deficit score
    deficit_score = min(100.0, deficit_ratio * 65.0)

    # Blockage & Silt score
    blockage_score = min(100.0, effective_blockage)

    # Terrain vulnerability score
    terrain_score = min(100.0, catchment_factor * 80.0)

    # Crowdsource Citizen reports factor
    crowd_score = min(100.0, citizen_reports_count * 30.0)

    # Weighted Composite Score
    composite_raw = (
        (rainfall_score * weights['rainfall_weight']) +
        (deficit_score * weights['drainage_deficit_weight']) +
        (blockage_score * weights['blockage_weight']) +
        (terrain_score * weights['impervious_slope_weight']) +
        (crowd_score * weights['crowd_report_weight'])
    )

    final_score = round(max(0.0, min(100.0, composite_raw)), 1)

    # Risk Band Categorization
    if final_score < 30.0:
        severity = 'green'
        risk_level = 'Low Risk'
        color = '#16a34a'
        action_summary = 'Drainage operating within nominal runoff tolerance. Normal traffic flow.'
    elif final_score < 55.0:
        severity = 'yellow'
        risk_level = 'Moderate Risk'
        color = '#ca8a04'
        action_summary = 'Minor curb pooling expected at low spots. Ward desilting crew on watch.'
    elif final_score < 80.0:
        severity = 'orange'
        risk_level = 'High Risk'
        color = '#ea580c'
        action_summary = 'Overtopping imminent or underway (15-30cm water). Slow vehicular speed advised.'
    else:
        severity = 'red'
        risk_level = 'Severe / Critical'
        color = '#dc2626'
        action_summary = 'Critical street inundation (>45cm). High risk of vehicle stall. Responders deploy pumps.'

    # Explainability Factor Breakdown
    explanations = []
    if effective_rainfall > effective_drainage:
        pct_exceeded = round(((effective_rainfall - effective_drainage) / effective_drainage) * 100)
        explanations.append(f"Effective rainfall load ({round(effective_rainfall, 1)} mm/hr) exceeds net drainage capacity ({round(effective_drainage, 1)} mm/hr) by {pct_exceeded}%.")
    else:
        margin = round(effective_drainage - effective_rainfall, 1)
        explanations.append(f"Drainage has a remaining buffer capacity of {margin} mm/hr under current rainfall.")

    if effective_blockage > 30.0:
        explanations.append(f"High drain obstruction: {round(blockage_pct)}% debris blockage and {round(silt_depth, 1)}cm accumulated silt reduce outfall velocity.")
    
    if structural_status != 'good':
        explanations.append(f"Drain structural condition is '{structural_status.title()}', reducing stormwater conveyance efficiency.")

    if slope < 0.8:
        explanations.append(f"Flat/depression terrain (slope {slope}%) inhibits gravitational runoff, creating a localized waterlogging sink.")

    if imperviousness > 0.8:
        explanations.append(f"High impervious surface density ({round(imperviousness*100)}% asphalt/concrete) generates immediate flash runoff without ground infiltration.")

    if citizen_reports_count > 0:
        explanations.append(f"{citizen_reports_count} verified citizen waterlogging report(s) actively logged in this street/vicinity.")

    return {
        'risk_score': final_score,
        'severity': severity,
        'risk_level': risk_level,
        'color': color,
        'action_summary': action_summary,
        'effective_rainfall_mm_hr': round(effective_rainfall, 1),
        'nominal_drainage_capacity_mm_hr': round(nominal_cap, 1),
        'effective_drainage_capacity_mm_hr': round(effective_drainage, 1),
        'surplus_water_mm_hr': round(surplus_load, 1),
        'effective_blockage_pct': round(effective_blockage, 1),
        'imperviousness_pct': round(imperviousness * 100),
        'slope_gradient_pct': slope,
        'factors_breakdown': {
            'rainfall_component': round(rainfall_score * weights['rainfall_weight'], 1),
            'drainage_deficit_component': round(deficit_score * weights['drainage_deficit_weight'], 1),
            'blockage_component': round(blockage_score * weights['blockage_weight'], 1),
            'terrain_component': round(terrain_score * weights['impervious_slope_weight'], 1),
            'crowdsource_component': round(crowd_score * weights['crowd_report_weight'], 1)
        },
        'explanations': explanations,
        'experimental_estimate': True,
        'disclaimer': 'Experimental nowcasting estimate based on hydrologic runoff calculations. Not an official meteorological emergency broadcast.'
    }
