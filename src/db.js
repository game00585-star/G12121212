import Dexie from "dexie";

export const localDB = new Dexie("DFarmPOS");

localDB.version(1).stores({
  products: "++id, barcode, name",

  salesHistory: "++id, เลขบิล, วันที่",

  users: "++id, username",
});
