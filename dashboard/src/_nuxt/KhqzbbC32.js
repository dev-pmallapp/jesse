import {
  D,
  Kt,
  On,
  Qn,
  Yt,
  _,
  b,
  bt,
  g,
  k,
  mt,
  nr,
  o,
  qt,
  tr,
  un,
  vn,
  y,
} from "./CoKk4mC0.js";
import { Et, Kt as Kt_1, Yt as Yt_1, ot, st } from "./Cd-sGgPF.js";
import { C, D as D_2 } from "./B8_r5oP7.js";
import { t as t_1 } from "./CQRhyXHt.js";
import { t as t_2 } from "./atteXEGs.js";
import { t as t_3 } from "./CJNUlr67.js";
import { t as t_4 } from "./BDNMzG2s2.js";
import { t as t_5 } from "./C5kJGiKi2.js";
function A(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 24 24`,
      fill: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        d: `M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z`,
      }),
      _(`path`, {
        d: `M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z`,
      }),
    ],
  );
}
function j(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 24 24`,
      fill: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "fill-rule": `evenodd`,
        d: `M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z`,
        "clip-rule": `evenodd`,
      }),
    ],
  );
}
function M(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 24 24`,
      fill: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "fill-rule": `evenodd`,
        d: `M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z`,
        "clip-rule": `evenodd`,
      }),
    ],
  );
}
const N = {
  class: `flex flex-col border-r dark:border-gray-600 h-full min-h-0 min-w-0`,
  style: {
    "overflow-x": `hidden !important`,
  },
};
const P = {
  class: `shrink-0 flex justify-between items-center border-b dark:border-gray-600 relative`,
};
const F = {
  class: `flex-1 overflow-y-auto min-h-0`,
  style: {
    "overflow-x": `hidden !important`,
  },
};
const I = {
  key: 0,
  class: `flex flex-col items-center justify-center py-8 px-4 text-center`,
};
const L = {
  class: `text-sm text-gray-600 dark:text-gray-400`,
};
const R = [`onMouseenter`];
const z = {
  class: `truncate block`,
};
export const t = Object.assign(
  t_4(
    k({
      __name: `StrategiesSidebar`,
      async setup(l) {
        let O;
        let B;
        let V = ot();
        let H = t_5();
        let U = g(() => H.strategies);
        let W = vn(``);
        let G = vn(null);
        let K = vn(false);
        let q = vn(null);
        let J = g(() =>
          U.value.filter((e) =>
            e.toLowerCase().includes(W.value.toLowerCase()),
          ),
        );
        function Y(e) {
          q.value = e;
          K.value = true;
        }
        async function onClick() {
          if (!q.value) {
            return;
          }
          let q_value = q.value;
          await H.deleteStrategy(q_value);
          K.value = false;
          q.value = null;
          if (ot().params.name === q_value) {
            st().push(`/strategies`);
          }
        }
        [O, B] = Kt(() =>
          C(`/strategy/all`, {
            authenticated: true,
          }),
        );
        O = await O;
        B();
        let Z = O;
        if (Z.error.value) {
          D_2(Z.error.value);
        } else {
          H.setStrategies(Z.data.value?.strategies ?? []);
        }
        return (t, c) => {
          let l = t_1;
          let g = t_3;
          let x = t_2;
          mt();
          return b(
            o,
            null,
            [
              _(`div`, N, [
                _(`div`, P, [
                  D(On(j), {
                    class: `absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none`,
                  }),
                  Yt(
                    _(
                      `input`,
                      {
                        "onUpdate:modelValue": (c[0] ||= (e) => {
                          if (un(W)) {
                            return (W.value = e);
                          }
                          return null;
                        }),
                        class: Qn([
                          `w-full pl-10 pr-4 py-2 bg-gray-50 focus:outline-hidden dark:bg-backdrop-dark`,
                          {
                            "pr-10": On(W),
                          },
                        ]),
                        placeholder: `Search strategies...`,
                      },
                      null,
                      2,
                    ),
                    [[Kt_1, On(W)]],
                  ),
                  D(
                    Et,
                    {
                      name: `fade`,
                    },
                    {
                      default: qt(() => [
                        On(W)
                          ? (mt(),
                            b(
                              `button`,
                              {
                                key: 0,
                                class: `absolute right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm transition-colors`,
                                onClick: (c[1] ||= (e) => (W.value = ``)),
                              },
                              [
                                D(On(M), {
                                  class: `w-4 h-4 text-gray-500 dark:text-gray-400`,
                                }),
                              ],
                            ))
                          : y(``, true),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                _(`div`, F, [
                  On(J).length === 0 && On(W)
                    ? (mt(),
                      b(`div`, I, [
                        D(On(j), {
                          class: `w-12 h-12 text-gray-400 dark:text-gray-600 mb-3`,
                        }),
                        _(`p`, L, ` No matches for "` + nr(On(W)) + `" `, 1),
                      ]))
                    : y(``, true),
                  (mt(true),
                  b(
                    o,
                    null,
                    bt(On(J), (t) => {
                      mt();
                      return b(
                        `div`,
                        {
                          key: t,
                          class: Qn([
                            `group relative px-4 py-2 cursor-pointer select-none flex items-center justify-between`,
                            On(V).params.name === t
                              ? `bg-gray-100 dark:bg-gray-800`
                              : `bg-gray-50 dark:bg-backdrop-dark hover:bg-gray-100 dark:hover:bg-gray-800`,
                          ]),
                          onMouseenter: (e) => (G.value = t),
                          onMouseleave: (c[2] ||= (e) => (G.value = null)),
                        },
                        [
                          D(
                            l,
                            {
                              to: `/strategies/${t}`,
                              class: `flex items-center flex-1 min-w-0`,
                            },
                            {
                              default: qt(() => [
                                D(On(A), {
                                  class: `shrink-0 w-4 h-4 mr-2`,
                                }),
                                _(`span`, z, nr(t), 1),
                              ]),
                              _: 2,
                            },
                            1032,
                            [`to`],
                          ),
                          D(
                            g,
                            {
                              size: `xs`,
                              icon: `i-heroicons-trash`,
                              color: `neutral`,
                              variant: `link`,
                              style: tr({
                                visibility: On(G) === t ? `visible` : `hidden`,
                              }),
                              onClick: Yt_1((e) => Y(t), [`prevent`]),
                            },
                            null,
                            8,
                            [`style`, `onClick`],
                          ),
                        ],
                        42,
                        R,
                      );
                    }),
                    128,
                  )),
                ]),
              ]),
              D(
                x,
                {
                  modelValue: On(K),
                  "onUpdate:modelValue": (c[3] ||= (e) => {
                    if (un(K)) {
                      return (K.value = e);
                    }
                    return null;
                  }),
                  title: `Delete strategy`,
                  description: `Are you sure you want to delete the strategy '${On(q)}'?`,
                  type: `info`,
                },
                {
                  default: qt(() => [
                    D(g, {
                      variant: `solid`,
                      color: `error`,
                      block: ``,
                      class: `sm:w-auto`,
                      label: `Delete`,
                      onClick,
                    }),
                  ]),
                  _: 1,
                },
                8,
                [`modelValue`, `description`],
              ),
            ],
            64,
          );
        };
      },
    }),
    [[`__scopeId`, `data-v-2d42d171`]],
  ),
  {
    __name: `StrategiesSidebar`,
  },
);
