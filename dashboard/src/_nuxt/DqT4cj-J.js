import { _, b, mt, xt, y } from "./CoKk4mC0.js";
import { t as t_1 } from "./BDNMzG2s2.js";
const o = {};
const s = {
  class: `flex min-h-full flex-1 flex-col`,
};
const c = {
  key: 0,
  class: `w-full shrink-0`,
};
const l = {
  class: `flex-1 p-3`,
};
const u = {
  class: `min-h-full rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
};
function d(a, o) {
  mt();
  return b(`div`, s, [
    a.$slots.tabs ? (mt(), b(`div`, c, [xt(a.$slots, `tabs`)])) : y(``, true),
    _(`div`, l, [_(`div`, u, [xt(a.$slots, `default`)])]),
  ]);
}
export const t = Object.assign(t_1(o, [[`render`, d]]), {
  __name: `HistoryPageShell`,
});
