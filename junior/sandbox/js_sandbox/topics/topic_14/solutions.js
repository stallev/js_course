/**
 * Тема 14 — Объекты
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function runUserCard() {
  const user = {
    name: "Анна",
    age: 20,
    city: "Казань",
    intro() {
      console.log(`${this.name} из ${this.city}`);
    },
  };
  console.log(user.name);
  console.log(user["city"]);
  user.age = 21;
  user.intro();
}
