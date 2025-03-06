use super::modbus_serial::{read_holding_registers, CurrentConnection};
use super::settings::SettingsState;
use std::f64::consts::E;
use tauri::State;
use tokio::sync::Mutex;

pub fn calculate_composition(x_0: f64, temp: f64, tol: f64, max_iter: u64) -> Result<f64, String> {
    let mut x = x_0;
    const H: f64 = 1e-5;

    for _ in 0..max_iter {
        let fx = calculate_residual(x, temp);
        let fx_prime =
            (calculate_residual(x + H, temp) - calculate_residual(x - H, temp)) / (2.0 * H);

        if fx_prime.abs() < 1e-12 {
            return Err("Error. Division by zero.".to_string());
        }

        let x_next = x - fx / fx_prime;

        if (x_next - x).abs() < tol {
            return Ok(x_next);
        }

        x = x_next;
    }

    Err("No value founded".to_string())
}

fn calculate_residual(x_1: f64, temp: f64) -> f64 {
    // Parameters Ethanol (1) - Water (2)
    const A1: f64 = 8.12875;
    const B1: f64 = 1660.8713;
    const C1: f64 = 238.131;
    const AVAN1: f64 = 1.6798;

    const A2: f64 = 8.05573;
    const B2: f64 = 1723.6425;
    const C2: f64 = 233.08;
    const AVAN2: f64 = 0.9227;

    const P: f64 = 585.0;
    let x_2 = 1.0 - x_1;

    let (gamma_1, gamma_2) = calculate_gammas(AVAN1, AVAN2, x_1, x_2);

    let ps_1 = calculate_ps(temp, A1, B1, C1);
    let ps_2 = calculate_ps(temp, A2, B2, C2);

    let k_1 = calculate_ks(gamma_1, ps_1, P);
    let k_2 = calculate_ks(gamma_2, ps_2, P);

    let y1 = calculate_y(k_1, x_1);
    let y2 = calculate_y(k_2, x_2);

    return y1 + y2 - 1.0;
}

pub async fn read_temperatures(
    settings_state: &State<'_, Mutex<SettingsState>>,
    connection_state: State<'_, Mutex<CurrentConnection>>,
) -> Result<Vec<f64>, String> {
    let settings = {
        let current_settings = settings_state.lock().await;
        current_settings.settings.clone()
    };
    let Some(settings) = settings else {
        return Err("Error to get settings".into());
    };

    let temperatures = read_holding_registers(
        connection_state,
        settings.temperature_address.bottom,
        settings.count,
        settings.timeout,
        settings.unit_id,
    )
    .await
    .map_err(|e| format!("Error in read temperatures {:?}", e))?;

    let temperature_bottom = temperatures[0].value;
    let temperature_top = temperatures[1].value;

    let temperature_bottom_format = temperature_bottom as f64 / 100.0;
    let temperature_top_format = temperature_top as f64 / 100.0;

    return Ok(vec![temperature_bottom_format, temperature_top_format]);
}

pub fn interpolate_temperatures(num_plates: usize, t1: f64, tn: f64) -> Vec<f64> {
    if num_plates <= 2 {
        return vec![t1, tn];
    }
    let mut interpolated_temps = Vec::with_capacity(num_plates);
    for i in 0..num_plates {
        let temp: f64 = t1 + (i as f64) / (num_plates as f64 - 1.0) * (tn - t1);
        interpolated_temps.push(temp);
    }
    interpolated_temps
}

fn calculate_ps(temperature: f64, a: f64, b: f64, c: f64) -> f64 {
    let log10_p: f64 = a - b / (c + temperature);

    let p = 10.0f64.powf(log10_p);
    return p;
}

fn calculate_gammas(a_12: f64, a_21: f64, x_1: f64, x_2: f64) -> (f64, f64) {
    let denominator = a_12 * x_1 + a_21 * x_2;
    let gamma1 = E.powf(a_12 * (a_21 * x_2 / denominator).powf(2.0));
    let gamma2 = E.powf(a_21 * (a_12 * x_1 / denominator).powf(2.0));
    (gamma1, gamma2)
}

fn calculate_ks(gamma: f64, ps: f64, p: f64) -> f64 {
    return gamma * ps / p;
}

fn calculate_y(k: f64, x: f64) -> f64 {
    return k * x;
}
