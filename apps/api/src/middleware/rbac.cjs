const exported = {};

module.exports = exported;

import("./rbac.js")
  .then((mod) => {
    Object.assign(exported, mod.default || mod);
  })
  .catch((err) => {
    process.nextTick(() => {
      throw err;
    });
  });
