import {
  On,
  Qn,
  Yt,
  _ as __1,
  b as b_1,
  bt,
  k as k_1,
  mt,
  nr,
  o as o_1,
  qt,
  v as v_1,
  vn,
  xt,
  y as y_1,
} from "./CoKk4mC0.js";
import { qt as qt_1 } from "./Cd-sGgPF.js";
const g = [`textContent`];
const _ = Object.assign(
  k_1({
    __name: `Tooltip`,
    props: {
      title: {},
    },
    setup(t) {
      let a = vn(false);
      let onMouseenter = () => {
        a.value = true;
      };
      let onMouseleave = () => {
        a.value = false;
      };
      return (u, d) => {
        mt();
        return b_1(
          `span`,
          {
            class: `relative underline`,
            onMouseenter,
            onMouseleave,
          },
          [
            Yt(
              __1(
                `span`,
                {
                  class: `absolute -top-10 z-90 bg-gray-900 rounded-sm px-2 py-1 text-sm text-white`,
                  textContent: nr(t.title),
                },
                null,
                8,
                g,
              ),
              [[qt_1, On(a)]],
            ),
            xt(u.$slots, `default`),
          ],
          32,
        );
      };
    },
  }),
  {
    __name: `Tooltip`,
  },
);
const v = {
  class: `flex flex-col select-none`,
};
const y = [`tabindex`, `role`, `aria-label`];
const b = {
  class: `py-2 align-middle inline-block min-w-full`,
};
const x = {
  class: `min-w-full divide-y divide-gray-200 dark:divide-gray-700 hide-scroll overflow-x-scroll`,
};
const S = {
  key: 1,
  class: `divide-y dark:divide-gray-700`,
};
const C = [`onClick`];
const w = [`textContent`];
const T = [`textContent`];
const E = [`textContent`];
const D = {
  key: 1,
};
const O = [`textContent`];
const k = [`textContent`];
const A = [`textContent`];
const j = {
  key: 0,
  class: `text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 py-10 select-none`,
};
export const t = Object.assign(
  k_1({
    __name: `MultipleValuesTable`,
    props: {
      header: {
        type: Boolean,
      },
      data: {},
      headerItems: {},
      clickable: {
        type: Boolean,
        default: false,
      },
      scrollable: {
        type: Boolean,
        default: false,
      },
      scrollLabel: {
        default: `Table rows`,
      },
    },
    emits: [`row-click`],
    setup(e, { emit }) {
      let o = e;
      let f = emit;
      return (n, p) => {
        let h = _;
        mt();
        return b_1(`div`, v, [
          __1(
            `div`,
            {
              class: Qn([
                `-my-2`,
                e.scrollable
                  ? `max-h-[32rem] overflow-auto overscroll-contain`
                  : `overflow-x-auto`,
              ]),
              tabindex: e.scrollable ? 0 : undefined,
              role: e.scrollable ? `region` : undefined,
              "aria-label": e.scrollable ? e.scrollLabel : undefined,
            },
            [
              __1(`div`, b, [
                __1(
                  `div`,
                  {
                    class: Qn([
                      `border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800`,
                      e.scrollable ? `overflow-clip` : `overflow-hidden`,
                    ]),
                  },
                  [
                    __1(`table`, x, [
                      e.header
                        ? (mt(),
                          b_1(
                            `thead`,
                            {
                              key: 0,
                              class: Qn([
                                `bg-gray-100 dark:bg-gray-700/50 select-none`,
                                e.scrollable ? `sticky top-0 z-10` : ``,
                              ]),
                            },
                            [
                              __1(`tr`, null, [
                                (mt(true),
                                b_1(
                                  o_1,
                                  null,
                                  bt(e.headerItems, (e) => {
                                    mt();
                                    return b_1(
                                      `th`,
                                      {
                                        key: e,
                                        scope: `col`,
                                        class: `px-6 py-4 text-left text-[10px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider`,
                                      },
                                      nr(e),
                                      1,
                                    );
                                  }),
                                  128,
                                )),
                              ]),
                            ],
                            2,
                          ))
                        : y_1(``, true),
                      e.data.length
                        ? (mt(),
                          b_1(`tbody`, S, [
                            (mt(true),
                            b_1(
                              o_1,
                              null,
                              bt(e.data, (e, n) => {
                                mt();
                                return b_1(
                                  `tr`,
                                  {
                                    key: n,
                                    class: Qn([
                                      `text-gray-900 dark:text-gray-200 transition-colors`,
                                      [
                                        o.clickable
                                          ? `cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50`
                                          : ``,
                                      ],
                                    ]),
                                    onClick: (e) => {
                                      if (o.clickable) {
                                        return f(`row-click`, n);
                                      }
                                      return null;
                                    },
                                  },
                                  [
                                    (mt(true),
                                    b_1(
                                      o_1,
                                      null,
                                      bt(e, (n, r) => {
                                        mt();
                                        return b_1(
                                          `td`,
                                          {
                                            key: r,
                                            class: Qn([
                                              `px-6 py-4 whitespace-nowrap text-sm font-medium`,
                                              e[r].style,
                                            ]),
                                          },
                                          [
                                            e[r].tooltip
                                              ? (mt(),
                                                v_1(
                                                  h,
                                                  {
                                                    key: 0,
                                                    title: e[r].tooltip,
                                                    popper: {
                                                      arrow: true,
                                                    },
                                                  },
                                                  {
                                                    default: qt(() => [
                                                      e[r].tag === `code`
                                                        ? (mt(),
                                                          b_1(
                                                            `code`,
                                                            {
                                                              key: 0,
                                                              class: `rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 w-full px-4 sm:px-6 py-2`,
                                                              textContent: nr(
                                                                e[r].value === 0
                                                                  ? ``
                                                                  : e[r].value,
                                                              ),
                                                            },
                                                            null,
                                                            8,
                                                            w,
                                                          ))
                                                        : e[r].tag === `pre`
                                                          ? (mt(),
                                                            b_1(
                                                              `pre`,
                                                              {
                                                                key: 1,
                                                                class: `whitespace-pre-line rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 w-full px-4 sm:px-6 py-2`,
                                                                textContent: nr(
                                                                  e[r].value ===
                                                                    0
                                                                    ? ``
                                                                    : e[r]
                                                                        .value,
                                                                ),
                                                              },
                                                              null,
                                                              8,
                                                              T,
                                                            ))
                                                          : (mt(),
                                                            b_1(
                                                              `span`,
                                                              {
                                                                key: 2,
                                                                textContent: nr(
                                                                  e[r].value ===
                                                                    0
                                                                    ? ``
                                                                    : e[r]
                                                                        .value,
                                                                ),
                                                              },
                                                              null,
                                                              8,
                                                              E,
                                                            )),
                                                    ]),
                                                    _: 2,
                                                  },
                                                  1032,
                                                  [`title`],
                                                ))
                                              : (mt(),
                                                b_1(`span`, D, [
                                                  e[r].tag === `code`
                                                    ? (mt(),
                                                      b_1(
                                                        `code`,
                                                        {
                                                          key: 0,
                                                          class: `rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 w-full px-4 sm:px-6 py-2`,
                                                          textContent: nr(
                                                            e[r].value === 0
                                                              ? ``
                                                              : e[r].value,
                                                          ),
                                                        },
                                                        null,
                                                        8,
                                                        O,
                                                      ))
                                                    : e[r].tag === `pre`
                                                      ? (mt(),
                                                        b_1(
                                                          `pre`,
                                                          {
                                                            key: 1,
                                                            class: `whitespace-pre-line rounded-sm border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 select-text text-sm dark:text-gray-300 w-full px-4 sm:px-6 py-2`,
                                                            textContent: nr(
                                                              e[r].value === 0
                                                                ? ``
                                                                : e[r].value,
                                                            ),
                                                          },
                                                          null,
                                                          8,
                                                          k,
                                                        ))
                                                      : (mt(),
                                                        b_1(
                                                          `span`,
                                                          {
                                                            key: 2,
                                                            textContent: nr(
                                                              e[r].value === 0
                                                                ? ``
                                                                : e[r].value,
                                                            ),
                                                          },
                                                          null,
                                                          8,
                                                          A,
                                                        )),
                                                ])),
                                          ],
                                          2,
                                        );
                                      }),
                                      128,
                                    )),
                                  ],
                                  10,
                                  C,
                                );
                              }),
                              128,
                            )),
                          ]))
                        : y_1(``, true),
                    ]),
                    e.data.length
                      ? y_1(``, true)
                      : (mt(), b_1(`div`, j, ` No data available `)),
                  ],
                  2,
                ),
              ]),
            ],
            10,
            y,
          ),
        ]);
      };
    },
  }),
  {
    __name: `MultipleValuesTable`,
  },
);
