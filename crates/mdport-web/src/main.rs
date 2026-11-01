use std::{env, fs::File, io::Read};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = env::args()
        .nth(1)
        .ok_or("usage: mdport-inspect RECORD.json")?;
    let mut input = String::new();
    File::open(path)?
        .take(mdport_web::MAX_BYTES as u64 + 1)
        .read_to_string(&mut input)?;
    println!("{}", mdport_web::inspect(&input));
    Ok(())
}
