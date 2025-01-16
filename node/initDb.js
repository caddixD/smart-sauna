const sqlite3 = require('sqlite3').verbose();

// Sukuriame duomenų bazę pavadinimu "pirtis.db"
const db = new sqlite3.Database('./pirtele.db');

// Sukuriame lenteles, jei jos neegzistuoja
db.serialize(() => {
  // Lentelė pirties duomenims
  db.run(`
    CREATE TABLE IF NOT EXISTS bathData (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      temperature INTEGER, 
      humidity INTEGER, 
      heaterStatus TEXT, 
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lentelė vartotojų informacijai
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      username TEXT, 
      password TEXT
    )
  `);


  // Įrašome pirties duomenis, jei reikia
  const stmtBath = db.prepare("INSERT INTO bathData (temperature, humidity, heaterStatus) VALUES (?, ?, ?)");
  stmtBath.run(60, 60, 'OFF');  // Pradiniai duomenys
  stmtBath.finalize();
});

// Funkcija įrašyti pirties duomenis
function saveBathData(temperature, humidity, heaterStatus) {
  const stmt = db.prepare("INSERT INTO bathData (temperature, humidity, heaterStatus) VALUES (?, ?, ?)");
  stmt.run(temperature, humidity, heaterStatus, function(err) {
    if (err) {
      console.error("Klaida įrašant į duomenų bazę:", err);
    } else {
      console.log(`Duomenys įrašyti: Temperatūra ${temperature}°C, Drėgmė ${humidity}%, Krosnies būsena: ${heaterStatus},`);
    }
  });
  stmt.finalize();
}

// Funkcija įrašyti vartotoją
function saveUser(username, password) {
  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  stmt.run(username, password, function(err) {
    if (err) {
      console.error("Klaida įrašant vartotoją į duomenų bazę:", err);
    } else {
      console.log(`Vartotojas ${username} įrašytas.`);
    }
  });
  stmt.finalize();
}

saveBathData(90, 60, 'ON', 'Rusiška pirtis'); // Pavyzdinis pirties įrašas

// Uždaryti duomenų bazę
db.close();
