import {
  D as D_1,
  On,
  Qn,
  Yt,
  _,
  b as b_1,
  bt,
  g,
  k as k_1,
  mt,
  nr,
  o as o_1,
  qt,
  un,
  v,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { Jt, Yt as Yt_1, q as q_1, qt as qt_1, st } from "./Cd-sGgPF.js";
import { n, t as t_1 } from "./2k_QeT3T.js";
import { d, t as t_2 } from "./B8_r5oP7.js";
import { t as t_3 } from "./CQRhyXHt.js";
import { t as t_4 } from "./atteXEGs.js";
import { i, n as n_2, r, t as t_5 } from "./IliqAppL.js";
import { f, t as t_6 } from "./OaeI3Ulg.js";
import { t as t_7 } from "./CJNUlr67.js";
import { t as t_8 } from "./BDNMzG2s2.js";
import { t as t_9 } from "./D1yN6wZY2.js";
function D(e, t) {
  mt();
  return b_1(
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
        d: `M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3`,
      }),
    ],
  );
}
function ue(e, t) {
  mt();
  return b_1(
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
        d: `m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z`,
      }),
    ],
  );
}
const de = {
  class: `mb-0`,
};
const fe = {
  class: `hidden lg:block`,
};
const pe = {
  class: `relative flex items-center px-2 border-b border-gray-200 dark:border-gray-700`,
  "aria-label": `Tabs`,
};
const me = {
  class: `relative z-10 flex items-center gap-1 py-1 shrink-0`,
};
const he = {
  class: `relative z-10 flex-1 min-w-0`,
};
const ge = {
  class: `flex items-center gap-1 py-1 pl-1 pr-1 min-w-0 overflow-hidden`,
};
const _e = [`onClick`];
const ve = {
  key: 0,
  class: `mr-2 shrink-0`,
};
const ye = {
  key: 0,
  class: `h-2 w-2 rounded-full bg-rose-500`,
};
const O = {
  key: 1,
  class: `h-2 w-2 rounded-full bg-green-500 animate-pulse`,
};
const k = [`onDblclick`];
const A = [`onClick`];
const j = [`onClick`];
const M = {
  class: `lg:hidden flex flex-col gap-1`,
};
const N = {
  class: `flex items-center gap-2 px-2 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-backdrop-dark`,
};
const P = {
  class: `flex items-center gap-2 min-w-0`,
};
const be = {
  key: 0,
  class: `h-2 w-2 rounded-full bg-green-500 shrink-0 animate-pulse`,
};
const xe = {
  class: `text-sm font-bold truncate text-gray-700 dark:text-gray-200`,
};
const Se = {
  class: `flex items-center gap-1.5 shrink-0`,
};
const Ce = {
  class: `flex items-center justify-between`,
};
const we = {
  class: `py-2 space-y-1 max-h-[60vh] overflow-y-auto`,
};
const Te = [`onClick`];
const Ee = {
  key: 0,
  class: `shrink-0`,
};
const De = {
  key: 0,
  class: `h-2.5 w-2.5 rounded-full bg-rose-500`,
};
const F = {
  key: 1,
  class: `h-2.5 w-2.5 rounded-full bg-green-500`,
};
const Oe = {
  class: `flex-1 min-w-0`,
};
const ke = [`onDblclick`];
const Ae = {
  key: 0,
  class: `text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5`,
};
const je = {
  key: 1,
  class: `flex items-center shrink-0`,
};
const Me = [`onClick`];
const Ne = [`onClick`];
export const t = Object.assign(
  t_8(
    k_1({
      __name: `BacktestTabs`,
      props: {
        tabs: {},
        currentTab: {},
      },
      emits: [`close`, `cancel`],
      setup(c, { emit }) {
        let I = d();
        t_2();
        let L = q_1();
        let R = g(() => L.params.id);
        let z = vn(false);
        let B = vn(false);
        let V = vn(null);
        let H = vn(``);
        let U = {
          mounted: (e) => {
            let t = e.querySelector(`input`) || e;
            t.focus();
            if (t instanceof HTMLInputElement) {
              t.select();
            }
          },
        };
        let W = emit;
        let G = c;
        let K = g(() => Object.keys(G.tabs).length);
        let q = g(() => K.value > 1);
        let J = g(() => K.value <= 10);
        let Pe = g(() => K.value > 10);
        function Fe() {
          z.value = false;
          I.addTab(G.currentTab);
        }
        function Ie() {
          B.value = false;
          I.closeAllTabs();
        }
        function Y(e) {
          st().push(`/backtest/${e}`);
        }
        function Le(e) {
          z.value = false;
          Y(e);
        }
        function X(e) {
          if (e.results.generalInfo.title) {
            if (e.results.executing) {
              return `${e.results.generalInfo.title} | ${e.results.progressbar.current}%`;
            }
            if (e.results.showResults) {
              return `${e.results.generalInfo.title} | Results`;
            }
            return e.results.generalInfo.title;
          }
          if (!e.form.routes.length) {
            return `New Tab`;
          }
          let t = e.form.routes[0];
          let n = ``;
          if (t.strategy) {
            n += `${t.strategy} • `;
          }
          if (t.symbol) {
            n += `${t.symbol} • `;
          }
          if (t.timeframe) {
            n += `${t.timeframe}`;
          }
          n = n.endsWith(` • `) ? n.slice(0, -3) : n;
          if (e.results.executing) {
            return `${n} | ${e.results.progressbar.current}%`;
          }
          if (e.results.showResults) {
            return `${n} | Results`;
          }
          return n;
        }
        function Z(e) {
          V.value = e.id;
          H.value = e.results.generalInfo.title || X(e).split(` | `)[0];
        }
        async function Q(e) {
          if (!V.value || H.value === (e.results.generalInfo.title || ``)) {
            $();
            return;
          }
          if (
            await d().updateSessionNotes(
              e.id,
              H.value,
              e.results.generalInfo.description || ``,
            )
          ) {
            e.results.generalInfo.title = H.value;
          }
          $();
        }
        function $() {
          V.value = null;
          H.value = ``;
        }
        return (s, h) => {
          let y = n;
          let b = t_3;
          let x = t_1;
          let S = t_7;
          let E = t_9;
          let G = t_6;
          let Re = t_4;
          mt();
          return b_1(`div`, de, [
            _(`div`, fe, [
              _(`nav`, pe, [
                (h[9] ||= _(
                  `div`,
                  {
                    "aria-hidden": `true`,
                    class: `absolute inset-0 z-0 bg-gray-50/50 dark:bg-backdrop-dark/50 backdrop-blur-xs pointer-events-none`,
                  },
                  null,
                  -1,
                )),
                _(`div`, me, [
                  D_1(
                    y,
                    {
                      text: `New Tab`,
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
                            "aria-label": `New tab`,
                            class: `flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 rounded-lg cursor-pointer transition-all duration-300 h-8 w-8`,
                            onClick: (h[0] ||= (e) =>
                              On(I).addTab(c.currentTab)),
                          },
                          [
                            D_1(On(n_2), {
                              class: `h-5 w-5`,
                            }),
                          ],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    y,
                    {
                      text: `History`,
                      arrow: ``,
                      content: {
                        sideOffset: 10,
                      },
                    },
                    {
                      default: qt(() => [
                        D_1(
                          b,
                          {
                            href: `/backtest/history`,
                            class: Qn([
                              On(L).path === `/backtest/history`
                                ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600`
                                : `text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/30`,
                              `flex items-center justify-center p-1.5 rounded-lg cursor-pointer transition-all duration-300 h-8 w-8`,
                            ]),
                          },
                          {
                            default: qt(() => [
                              D_1(On(r), {
                                class: `h-5 w-5`,
                              }),
                            ]),
                            _: 1,
                          },
                          8,
                          [`class`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  D_1(
                    y,
                    {
                      text: `Benchmark`,
                      arrow: ``,
                      content: {
                        sideOffset: 10,
                      },
                    },
                    {
                      default: qt(() => [
                        D_1(
                          b,
                          {
                            href: `/backtest/benchmark`,
                            class: Qn([
                              On(L).path === `/backtest/benchmark`
                                ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600`
                                : `text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/30`,
                              `flex items-center justify-center p-1.5 rounded-lg cursor-pointer transition-all duration-300 h-8 w-8`,
                            ]),
                          },
                          {
                            default: qt(() => [
                              D_1(On(D), {
                                class: `h-5 w-5`,
                              }),
                            ]),
                            _: 1,
                          },
                          8,
                          [`class`],
                        ),
                      ]),
                      _: 1,
                    },
                  ),
                  On(Pe)
                    ? (mt(),
                      v(
                        y,
                        {
                          key: 0,
                          text: `Close all ${On(K)} tabs`,
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
                                class: `flex items-center justify-center p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all duration-300 h-8 w-8`,
                                onClick: (h[1] ||= (e) => (B.value = true)),
                              },
                              [
                                D_1(On(ue), {
                                  class: `h-5 w-5`,
                                }),
                              ],
                            ),
                          ]),
                          _: 1,
                        },
                        8,
                        [`text`],
                      ))
                    : y_1(``, true),
                ]),
                (h[10] ||= _(
                  `div`,
                  {
                    class: `relative z-10 w-px h-6 bg-gray-300 dark:bg-gray-600 ml-3 mr-2 shrink-0`,
                  },
                  null,
                  -1,
                )),
                _(`div`, he, [
                  _(`div`, ge, [
                    (mt(true),
                    b_1(
                      o_1,
                      null,
                      bt(c.tabs, (o) => {
                        mt();
                        return v(
                          y,
                          {
                            key: o.id,
                            class: `flex-shrink min-w-0`,
                            text: X(o),
                            "delay-duration": 700,
                            arrow: ``,
                            content: {
                              sideOffset: 10,
                            },
                            onMouseup: Yt_1(
                              (e) => W(`close`, o.id),
                              [`middle`],
                            ),
                          },
                          {
                            default: qt(() => [
                              _(
                                `div`,
                                {
                                  class: Qn([
                                    o.id === On(R)
                                      ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600`
                                      : `text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/30`,
                                    `group relative flex items-center py-1 text-xs font-bold rounded-lg cursor-pointer transition-all duration-300 select-none overflow-hidden h-8 max-w-[240px] min-w-0 px-2`,
                                  ]),
                                  onClick: (e) => Y(o.id),
                                },
                                [
                                  o.results.executing ||
                                  o.results.exception.error
                                    ? (mt(),
                                      b_1(`div`, ve, [
                                        o.results.exception.error
                                          ? (mt(), b_1(`div`, ye))
                                          : o.results.executing
                                            ? (mt(), b_1(`div`, O))
                                            : y_1(``, true),
                                      ]))
                                    : y_1(``, true),
                                  On(V) === o.id
                                    ? Yt(
                                        (mt(),
                                        v(
                                          x,
                                          {
                                            key: 1,
                                            modelValue: On(H),
                                            "onUpdate:modelValue": (h[2] ||= (
                                              e,
                                            ) => {
                                              if (un(H)) {
                                                return (H.value = e);
                                              }
                                              return null;
                                            }),
                                            size: `xs`,
                                            class: `flex-1 min-w-0`,
                                            onKeyup: [
                                              Jt((e) => Q(o), [`enter`]),
                                              Jt($, [`esc`]),
                                            ],
                                            onBlur: (e) => Q(o),
                                          },
                                          null,
                                          8,
                                          [`modelValue`, `onKeyup`, `onBlur`],
                                        )),
                                        [[U]],
                                      )
                                    : (mt(),
                                      b_1(
                                        `span`,
                                        {
                                          key: 2,
                                          class: Qn([
                                            `flex-1 min-w-0 whitespace-nowrap overflow-hidden text-clip text-left pr-8`,
                                            On(q) &&
                                            o.id === On(R) &&
                                            On(V) !== o.id
                                              ? `tab-text-fade-active`
                                              : ``,
                                            On(q) &&
                                            o.id !== On(R) &&
                                            On(J) &&
                                            On(V) !== o.id
                                              ? `tab-text-fade-hover`
                                              : ``,
                                          ]),
                                          onDblclick: Yt_1(
                                            (e) => Z(o),
                                            [`stop`],
                                          ),
                                        },
                                        nr(X(o)),
                                        43,
                                        k,
                                      )),
                                  Yt(
                                    _(
                                      `div`,
                                      {
                                        class: Qn([
                                          `absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-end transition-opacity duration-150`,
                                          o.id === On(R)
                                            ? `opacity-100 pointer-events-auto`
                                            : On(J)
                                              ? `opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto`
                                              : `opacity-0 pointer-events-none`,
                                        ]),
                                      },
                                      [
                                        o.results.executing &&
                                        o.results.exception.error == ``
                                          ? (mt(),
                                            b_1(
                                              `button`,
                                              {
                                                key: 0,
                                                class: `p-0.5 rounded-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-all focus:outline-hidden`,
                                                onClick: Yt_1(
                                                  (e) => W(`cancel`, o.id),
                                                  [`stop`],
                                                ),
                                              },
                                              [
                                                D_1(On(t_5), {
                                                  class: `h-3.5 w-3.5`,
                                                }),
                                              ],
                                              8,
                                              A,
                                            ))
                                          : (mt(),
                                            b_1(
                                              `button`,
                                              {
                                                key: 1,
                                                class: `p-0.5 rounded-full text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-all focus:outline-hidden`,
                                                onClick: Yt_1(
                                                  (e) => W(`close`, o.id),
                                                  [`stop`],
                                                ),
                                              },
                                              [
                                                D_1(On(f), {
                                                  class: `h-3.5 w-3.5`,
                                                }),
                                              ],
                                              8,
                                              j,
                                            )),
                                      ],
                                      2,
                                    ),
                                    [[qt_1, On(q) && On(V) !== o.id]],
                                  ),
                                ],
                                10,
                                _e,
                              ),
                            ]),
                            _: 2,
                          },
                          1032,
                          [`text`, `onMouseup`],
                        );
                      }),
                      128,
                    )),
                  ]),
                ]),
              ]),
            ]),
            _(`div`, M, [
              _(`div`, N, [
                _(
                  `button`,
                  {
                    class: `flex-1 flex items-center justify-between gap-2 px-3 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl active:scale-95 transition-all overflow-hidden`,
                    onClick: (h[3] ||= (e) => (z.value = true)),
                  },
                  [
                    _(`div`, P, [
                      c.tabs[On(R)]?.results.executing
                        ? (mt(), b_1(`div`, be))
                        : y_1(``, true),
                      _(
                        `span`,
                        xe,
                        nr(c.tabs[On(R)] ? X(c.tabs[On(R)]) : `Select Tab`),
                        1,
                      ),
                    ]),
                    D_1(On(i), {
                      class: `h-4 w-4 text-gray-400 shrink-0`,
                    }),
                  ],
                ),
                _(`div`, Se, [
                  D_1(
                    b,
                    {
                      href: `/backtest/history`,
                      class: Qn([
                        On(L).path === `/backtest/history`
                          ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600`
                          : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700`,
                        `flex items-center justify-center rounded-xl transition-all h-10 w-10`,
                      ]),
                    },
                    {
                      default: qt(() => [
                        D_1(On(r), {
                          class: `h-5 w-5`,
                        }),
                      ]),
                      _: 1,
                    },
                    8,
                    [`class`],
                  ),
                  D_1(
                    b,
                    {
                      href: `/backtest/benchmark`,
                      class: Qn([
                        On(L).path === `/backtest/benchmark`
                          ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600`
                          : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700`,
                        `flex items-center justify-center rounded-xl transition-all h-10 w-10`,
                      ]),
                    },
                    {
                      default: qt(() => [
                        D_1(On(D), {
                          class: `h-5 w-5`,
                        }),
                      ]),
                      _: 1,
                    },
                    8,
                    [`class`],
                  ),
                ]),
              ]),
              D_1(
                G,
                {
                  open: On(z),
                  "onUpdate:open": (h[7] ||= (e) => {
                    if (un(z)) {
                      return (z.value = e);
                    }
                    return null;
                  }),
                  ui: {
                    content: `max-w-md`,
                  },
                },
                {
                  content: qt(() => [
                    D_1(
                      E,
                      {
                        ui: {
                          root: `ring-0 shadow-none divide-y divide-gray-100 dark:divide-gray-800`,
                        },
                      },
                      {
                        header: qt(() => [
                          _(`div`, Ce, [
                            (h[11] ||= _(
                              `h3`,
                              {
                                class: `text-base font-bold text-gray-900 dark:text-white`,
                              },
                              ` Backtest Tabs `,
                              -1,
                            )),
                            D_1(S, {
                              color: `neutral`,
                              variant: `ghost`,
                              icon: `i-heroicons-x-mark-20-solid`,
                              class: `-my-1`,
                              onClick: (h[4] ||= (e) => (z.value = false)),
                            }),
                          ]),
                        ]),
                        footer: qt(() => [
                          D_1(S, {
                            block: ``,
                            color: `neutral`,
                            variant: `subtle`,
                            icon: `i-heroicons-plus-circle`,
                            label: `New tab`,
                            size: `lg`,
                            class: `font-bold rounded-xl`,
                            onClick: Fe,
                          }),
                        ]),
                        default: qt(() => [
                          _(`div`, we, [
                            (mt(true),
                            b_1(
                              o_1,
                              null,
                              bt(c.tabs, (o) => {
                                mt();
                                return b_1(
                                  `div`,
                                  {
                                    key: o.id,
                                    class: `px-2`,
                                  },
                                  [
                                    _(
                                      `div`,
                                      {
                                        class: Qn([
                                          o.id === On(R)
                                            ? `bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/50`
                                            : `bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700`,
                                          `flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group`,
                                        ]),
                                        onClick: (e) => Le(o.id),
                                      },
                                      [
                                        o.results.executing ||
                                        o.results.exception.error
                                          ? (mt(),
                                            b_1(`div`, Ee, [
                                              o.results.exception.error
                                                ? (mt(), b_1(`div`, De))
                                                : o.results.executing
                                                  ? (mt(), b_1(`div`, F))
                                                  : y_1(``, true),
                                            ]))
                                          : y_1(``, true),
                                        _(`div`, Oe, [
                                          On(V) === o.id
                                            ? Yt(
                                                (mt(),
                                                v(
                                                  x,
                                                  {
                                                    key: 0,
                                                    modelValue: On(H),
                                                    "onUpdate:modelValue":
                                                      (h[5] ||= (e) => {
                                                        if (un(H)) {
                                                          return (H.value = e);
                                                        }
                                                        return null;
                                                      }),
                                                    size: `sm`,
                                                    class: `w-full`,
                                                    onKeyup: [
                                                      Jt(
                                                        (e) => Q(o),
                                                        [`enter`],
                                                      ),
                                                      Jt($, [`esc`]),
                                                    ],
                                                    onBlur: (e) => Q(o),
                                                    onClick: (h[6] ||=
                                                      Yt_1(() => {}, [`stop`])),
                                                  },
                                                  null,
                                                  8,
                                                  [
                                                    `modelValue`,
                                                    `onKeyup`,
                                                    `onBlur`,
                                                  ],
                                                )),
                                                [[U]],
                                              )
                                            : (mt(),
                                              b_1(
                                                o_1,
                                                {
                                                  key: 1,
                                                },
                                                [
                                                  _(
                                                    `div`,
                                                    {
                                                      class: Qn([
                                                        `text-sm font-bold truncate`,
                                                        o.id === On(R)
                                                          ? `text-indigo-600 dark:text-indigo-400`
                                                          : `text-gray-700 dark:text-gray-200`,
                                                      ]),
                                                      onDblclick: Yt_1(
                                                        (e) => Z(o),
                                                        [`stop`],
                                                      ),
                                                    },
                                                    nr(X(o)),
                                                    43,
                                                    ke,
                                                  ),
                                                  o.results.executing
                                                    ? (mt(),
                                                      b_1(
                                                        `div`,
                                                        Ae,
                                                        ` Executing... ` +
                                                          nr(
                                                            o.results
                                                              .progressbar
                                                              .current,
                                                          ) +
                                                          `% `,
                                                        1,
                                                      ))
                                                    : y_1(``, true),
                                                ],
                                                64,
                                              )),
                                        ]),
                                        On(q) && On(V) !== o.id
                                          ? (mt(),
                                            b_1(`div`, je, [
                                              o.results.executing &&
                                              o.results.exception.error == ``
                                                ? (mt(),
                                                  b_1(
                                                    `button`,
                                                    {
                                                      key: 0,
                                                      class: `p-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 active:scale-95 transition-all`,
                                                      onClick: Yt_1(
                                                        (e) =>
                                                          W(`cancel`, o.id),
                                                        [`stop`],
                                                      ),
                                                    },
                                                    [
                                                      D_1(On(t_5), {
                                                        class: `h-4 w-4`,
                                                      }),
                                                    ],
                                                    8,
                                                    Me,
                                                  ))
                                                : (mt(),
                                                  b_1(
                                                    `button`,
                                                    {
                                                      key: 1,
                                                      class: `p-2 rounded-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 active:scale-95 transition-all`,
                                                      onClick: Yt_1(
                                                        (e) => W(`close`, o.id),
                                                        [`stop`],
                                                      ),
                                                    },
                                                    [
                                                      D_1(On(f), {
                                                        class: `h-4 w-4`,
                                                      }),
                                                    ],
                                                    8,
                                                    Ne,
                                                  )),
                                            ]))
                                          : y_1(``, true),
                                      ],
                                      10,
                                      Te,
                                    ),
                                  ],
                                );
                              }),
                              128,
                            )),
                          ]),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  _: 1,
                },
                8,
                [`open`],
              ),
            ]),
            D_1(
              Re,
              {
                modelValue: On(B),
                "onUpdate:modelValue": (h[8] ||= (e) => {
                  if (un(B)) {
                    return (B.value = e);
                  }
                  return null;
                }),
                title: `Close All Tabs`,
                description: `Are you sure you want to close all ${On(K)} open tabs? The sessions stay saved and remain accessible from the History page.`,
                type: `info`,
              },
              {
                default: qt(() => [
                  D_1(S, {
                    variant: `solid`,
                    color: `error`,
                    block: ``,
                    class: `sm:w-auto`,
                    label: `Close All`,
                    onClick: Ie,
                  }),
                ]),
                _: 1,
              },
              8,
              [`modelValue`, `description`],
            ),
          ]);
        };
      },
    }),
    [[`__scopeId`, `data-v-fb9a62d2`]],
  ),
  {
    __name: `BacktestTabs`,
  },
);
