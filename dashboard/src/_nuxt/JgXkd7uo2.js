import {
  D,
  Qn,
  _ as __1,
  b as b_1,
  k,
  mt,
  nr,
  qt,
  v as v_1,
  xt,
  y as y_1,
} from "./CoKk4mC0.js";
import { n } from "./2k_QeT3T.js";
import { i as i_1 } from "./CJNUlr67.js";
const p = {
  class: `text-sm font-semibold text-gray-900 dark:text-white`,
};
const m = {
  class: `flex shrink-0 items-center gap-2`,
};
const h = [`href`];
const g = {
  key: 1,
  class: `flex items-center text-gray-300 dark:text-gray-600`,
};
const _ = {
  key: 1,
  class: `border-t border-gray-200 p-3 dark:border-gray-700`,
};
export const t = Object.assign(
  k({
    __name: `SectionCard`,
    props: {
      title: {},
      flat: {
        type: Boolean,
      },
      flush: {
        type: Boolean,
      },
      overflowHidden: {
        type: Boolean,
      },
      selectable: {
        type: Boolean,
      },
      help: {},
      helpLink: {},
    },
    setup(i) {
      return (v, y) => {
        let b = i_1;
        let x = n;
        mt();
        return b_1(
          `section`,
          {
            class: Qn([
              i.flat
                ? ``
                : `rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
              i.overflowHidden ? `overflow-hidden` : ``,
              i.selectable ? `select-none` : ``,
            ]),
          },
          [
            i.title || v.$slots.header
              ? (mt(),
                b_1(
                  `div`,
                  {
                    key: 0,
                    class: Qn([
                      `flex items-center justify-between gap-3 px-4`,
                      i.flat
                        ? `pt-4 pb-2`
                        : `border-b border-gray-200 py-3 dark:border-gray-700`,
                    ]),
                  },
                  [
                    __1(`h3`, p, nr(i.title), 1),
                    __1(`div`, m, [
                      xt(v.$slots, `header`),
                      i.help
                        ? (mt(),
                          v_1(
                            x,
                            {
                              key: 0,
                              text: i.helpLink
                                ? `${i.help} Click to read the docs.`
                                : i.help,
                              arrow: ``,
                              ui: {
                                content: `h-auto max-w-xs px-2.5 py-1.5`,
                                text: `text-clip whitespace-normal`,
                              },
                            },
                            {
                              default: qt(() => [
                                i.helpLink
                                  ? (mt(),
                                    b_1(
                                      `a`,
                                      {
                                        key: 0,
                                        href: i.helpLink,
                                        target: `_blank`,
                                        class: `flex items-center text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300`,
                                      },
                                      [
                                        D(b, {
                                          name: `i-heroicons-question-mark-circle`,
                                          class: `size-4`,
                                        }),
                                      ],
                                      8,
                                      h,
                                    ))
                                  : (mt(),
                                    b_1(`span`, g, [
                                      D(b, {
                                        name: `i-heroicons-question-mark-circle`,
                                        class: `size-4`,
                                      }),
                                    ])),
                              ]),
                              _: 1,
                            },
                            8,
                            [`text`],
                          ))
                        : y_1(``, true),
                    ]),
                  ],
                  2,
                ))
              : y_1(``, true),
            __1(
              `div`,
              {
                class: Qn(i.flush ? `` : i.flat ? `px-4 pb-4` : `px-4 py-4`),
              },
              [xt(v.$slots, `default`)],
              2,
            ),
            v.$slots.footer
              ? (mt(), b_1(`div`, _, [xt(v.$slots, `footer`)]))
              : y_1(``, true),
          ],
          2,
        );
      };
    },
  }),
  {
    __name: `SectionCard`,
  },
);
