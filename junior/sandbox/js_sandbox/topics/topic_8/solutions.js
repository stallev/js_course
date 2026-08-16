/**
 * Тема 8 — if / switch
 * Junior sandbox | только JavaScript
 *
 * Браузер: Live Server → browser/index.html
 * Терминал (из этой папки): node exercises.js
 *
 * Сначала TODO здесь, потом сверься с solutions.js
 */

export function access() {
  const age = 20;
  const hasTicket = true;
  if (age < 18) {
    console.log("рано");
  } else if (hasTicket === false) {
    console.log("нет билета");
  } else {
    console.log("вход");
  }
}

export function statusSwitch() {
  const status = "ok";
  switch (status) {
    case "ok":
      console.log("успех");
      break;
    case "error":
      console.log("сбой");
      break;
    default:
      console.log("неизвестно");
  }
}
