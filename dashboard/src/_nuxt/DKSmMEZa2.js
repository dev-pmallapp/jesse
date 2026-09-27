import { _, b, mt, xt } from "./CoKk4mC0.js";
import { t as t_1 } from "./BDNMzG2s2.js";
const a = {};
const o = {
  class: `text-center rounded-sm border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-4 text-sm`,
};
function s(i, a) {
  mt();
  return b(`div`, o, [
    xt(i.$slots, `default`, {}, () => [
      (a[0] ||= _(
        `span`,
        {
          class: `text-gray-400`,
        },
        ` Empty `,
        -1,
      )),
    ]),
  ]);
}
export const t = Object.assign(t_1(a, [[`render`, s]]), {
  __name: `EmptyBox`,
});
