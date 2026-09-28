import {
  $,
  D as D_1,
  Ft,
  Ht,
  On,
  Qn,
  _,
  b,
  g,
  k as k_1,
  mt,
  nr,
  qt,
  v,
  vn,
  wt,
  xt,
  y,
} from "./CoKk4mC0.js";
import { n as n_1 } from "./2k_QeT3T.js";
import { f, t as t_1 } from "./OaeI3Ulg.js";
import { t as t_2 } from "./CJNUlr67.js";
export function r(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      fill: `none`,
      viewBox: `0 0 24 24`,
      "stroke-width": `1.5`,
      stroke: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `m4.5 12.75 6 6 9-13.5`,
      }),
    ],
  );
}
function C(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      fill: `none`,
      viewBox: `0 0 24 24`,
      "stroke-width": `1.5`,
      stroke: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z`,
      }),
    ],
  );
}
export function n(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      fill: `none`,
      viewBox: `0 0 24 24`,
      "stroke-width": `1.5`,
      stroke: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z`,
      }),
    ],
  );
}
function T(e, t) {
  mt();
  return b(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      fill: `none`,
      viewBox: `0 0 24 24`,
      "stroke-width": `1.5`,
      stroke: `currentColor`,
      "aria-hidden": `true`,
      "data-slot": `icon`,
    },
    [
      _(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636`,
      }),
    ],
  );
}
const E = {
  class: `p-6`,
};
const D = {
  class: `flex items-start justify-between`,
};
const O = {
  class: `flex items-center gap-3`,
};
const k = {
  class: `text-xl font-semibold text-gray-900 dark:text-white leading-6`,
};
const A = {
  key: 0,
  class: `mt-4`,
};
const j = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
export const t = Object.assign(
  k_1({
    __name: `ConfirmModal`,
    props: $(
      {
        title: {},
        description: {},
        type: {},
        cancelBtnContent: {},
      },
      {
        modelValue: {
          type: Boolean,
        },
        modelModifiers: {},
      },
    ),
    emits: [`update:modelValue`],
    setup(e) {
      let l = Ft(e, `modelValue`);
      let M = vn();
      let N = e;
      let P = g(() => {
        switch (N.type) {
          case `info`:
            return {
              text: `text-blue-600 dark:text-blue-400`,
              bg: `bg-blue-50 dark:bg-blue-900/20`,
            };
          case `warning`:
            return {
              text: `text-orange-600 dark:text-orange-400`,
              bg: `bg-orange-50 dark:bg-orange-900/20`,
            };
          case `success`:
            return {
              text: `text-green-600 dark:text-green-400`,
              bg: `bg-green-50 dark:bg-green-900/20`,
            };
          case `danger`:
            return {
              text: `text-red-600 dark:text-red-400`,
              bg: `bg-red-50 dark:bg-red-900/20`,
            };
          default:
            return {
              text: `text-gray-600 dark:text-gray-400`,
              bg: `bg-gray-50 dark:bg-gray-900/20`,
            };
        }
      });
      let F = g(() => {
        switch (N.type) {
          case `info`:
            return n;
          case `warning`:
            return C;
          case `success`:
            return r;
          case `danger`:
            return T;
          default:
            return C;
        }
      });
      Ht(l, (e) => {
        if (e) {
          setTimeout(() => {
            let e = M.value?.querySelector(`button:last-child`);
            if (e) {
              e.focus();
            }
          }, 100);
        }
      });
      return (n, r) => {
        let c = n_1;
        let m = t_2;
        let S = t_1;
        mt();
        return v(
          S,
          {
            open: l.value,
            "onUpdate:open": (r[2] ||= (e) => (l.value = e)),
          },
          {
            content: qt(() => [
              _(`div`, E, [
                _(`div`, D, [
                  _(`div`, O, [
                    _(
                      `div`,
                      {
                        class: Qn([
                          On(P).bg,
                          `shrink-0 flex items-center justify-center h-10 w-10 rounded-full`,
                        ]),
                      },
                      [
                        (mt(),
                        v(
                          wt(On(F)),
                          {
                            class: Qn([On(P).text, `h-6 w-6`]),
                            "aria-hidden": `true`,
                          },
                          null,
                          8,
                          [`class`],
                        )),
                      ],
                      2,
                    ),
                    _(`h3`, k, nr(e.title), 1),
                  ]),
                  D_1(
                    c,
                    {
                      text: `Close`,
                      arrow: ``,
                      content: {
                        sideOffset: 10,
                      },
                    },
                    {
                      default: qt(() => [
                        _(
                          `button`,
                          {
                            class: `p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-hidden transition-all duration-300`,
                            onClick: (r[0] ||= (e) => (l.value = false)),
                          },
                          [
                            D_1(On(f), {
                              class: `h-6 w-6`,
                              "aria-hidden": `true`,
                            }),
                          ],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                ]),
                e.description
                  ? (mt(), b(`div`, A, [_(`p`, j, nr(e.description), 1)]))
                  : y(``, true),
                xt(n.$slots, `fields`),
                _(
                  `div`,
                  {
                    ref_key: `actionsContainer`,
                    ref: M,
                    class: `mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3`,
                  },
                  [
                    D_1(
                      m,
                      {
                        variant: `ghost`,
                        color: `neutral`,
                        block: ``,
                        class: `sm:w-auto`,
                        label: e.cancelBtnContent
                          ? e.cancelBtnContent
                          : e.type === `danger`
                            ? `Cancel`
                            : `Close`,
                        onClick: (r[1] ||= (e) => (l.value = false)),
                      },
                      null,
                      8,
                      [`label`],
                    ),
                    xt(n.$slots, `default`),
                  ],
                  512,
                ),
              ]),
            ]),
            _: 3,
          },
          8,
          [`open`],
        );
      };
    },
  }),
  {
    __name: `ConfirmModal`,
  },
);
