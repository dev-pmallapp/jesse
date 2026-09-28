import { r as r_1 } from "./QTnfLwEv.js";
import {
  $ as $_1,
  D as D_1,
  E,
  Ft as Ft_1,
  Ht as Ht_1,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt as bt_1,
  ct as ct_1,
  ft as ft_1,
  g as g_1,
  k,
  mt as mt_1,
  nr,
  o as o_1,
  qt as qt_1,
  tr,
  tt as tt_1,
  un,
  v as v_1,
  vn,
  xt as xt_1,
  y as y_1,
} from "./CoKk4mC0.js";
import { Jt as Jt_1, Yt as Yt_1 } from "./Cd-sGgPF.js";
import { n } from "./2k_QeT3T.js";
import { E as E_2, O, f as f_1, w } from "./B8_r5oP7.js";
import { f as f_2, t as t_1 } from "./OaeI3Ulg.js";
import { i as i_1, t as t_2 } from "./CJNUlr67.js";
import { t as t_3 } from "./BDNMzG2s2.js";
import { t as t_4 } from "./D1yN6wZY2.js";
import { t as t_5 } from "./uf1cV9ZP.js";
import { n as n_2, r as r_2, t as t_6 } from "./eDEyLi0S.js";
export function p(e, t) {
  mt_1();
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
      __1(`path`, {
        "stroke-linecap": `round`,
        "stroke-linejoin": `round`,
        d: `M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184`,
      }),
    ],
  );
}
const j = {
  class: `flex items-center justify-between`,
};
export const f = Object.assign(
  k({
    __name: `FullscreenModal`,
    props: {
      modelValue: {
        type: Boolean,
        default: false,
      },
      modelModifiers: {},
    },
    emits: [`update:modelValue`],
    setup(e) {
      let t = Ft_1(e, `modelValue`);
      return (e, r) => {
        let i = n;
        let a = t_4;
        let s = t_1;
        mt_1();
        return v_1(
          s,
          {
            open: t.value,
            "onUpdate:open": (r[1] ||= (e) => (t.value = e)),
            fullscreen: ``,
          },
          {
            content: qt_1(() => [
              D_1(
                a,
                {
                  ui: {
                    root: `h-full flex flex-col bg-gray-50 dark:bg-gray-950 rounded-none divide-y-0`,
                    header: `shrink-0 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5 sm:py-3`,
                    body: `grow min-h-0 p-2 sm:p-3`,
                  },
                },
                {
                  header: qt_1(() => [
                    __1(`div`, j, [
                      __1(`div`, null, [xt_1(e.$slots, `title`)]),
                      D_1(
                        i,
                        {
                          text: `Close`,
                          arrow: ``,
                          content: {
                            sideOffset: 10,
                          },
                        },
                        {
                          default: qt_1(() => [
                            __1(
                              `button`,
                              {
                                class: `p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-hidden`,
                                onClick: (r[0] ||= (e) => (t.value = false)),
                              },
                              [
                                D_1(On(f_2), {
                                  class: `h-5 w-5`,
                                  "aria-hidden": `true`,
                                }),
                              ],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                  ]),
                  default: qt_1(() => [xt_1(e.$slots, `default`)]),
                  _: 3,
                },
              ),
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
    __name: `FullscreenModal`,
  },
);
export function l(e, t) {
  return e === `ended` || ([`running`, `stopping`].includes(e) && !t);
}
export function c(e) {
  return JSON.stringify([e.strategy, e.symbol, e.timeframe]);
}
function F(e) {
  if (!Number.isFinite(e) || Number.isInteger(e)) {
    return 0;
  }
  let t = String(e);
  let n = t.indexOf(`e-`);
  if (n !== -1) {
    let e = Number(t.slice(n + 2));
    let r = t.slice(0, n);
    let i = r.indexOf(`.`);
    return e + (i === -1 ? 0 : r.length - i - 1);
  }
  let r = t.indexOf(`.`);
  if (r === -1) {
    return 0;
  }
  return t.length - r - 1;
}
function I(e, t = 8) {
  if (e.length === 0) {
    return 2;
  }
  let n = Math.max(1, Math.floor(e.length / 50));
  let r = 0;
  for (let t = 0; t < e.length; t += n) {
    r = Math.max(r, F(e[t]));
  }
  r = Math.max(r, F(e[e.length - 1]));
  return Math.min(r, t);
}
function L(e) {
  return 1 / 10 ** e;
}
function pe(e, t = true) {
  let n = I(e);
  return {
    lastValueVisible: t,
    priceLineVisible: t,
    priceFormat: {
      type: `price`,
      precision: n,
      minMove: L(n),
    },
  };
}
function me(e) {
  if (e.length < 2) {
    return null;
  }
  return e[1].time - e[0].time;
}
function he(e) {
  if (e === null) {
    return null;
  }
  return e.value ?? e.close ?? null;
}
function ge(e = true) {
  return {
    lineWidth: 1,
    lastValueVisible: false,
    priceLineVisible: false,
    visible: e,
  };
}
const R = {
  red: {
    light: `#DC2626`,
    dark: `#F87171`,
  },
  orange: {
    light: `#EA580C`,
    dark: `#FB923C`,
  },
  amber: {
    light: `#D97706`,
    dark: `#FBBF24`,
  },
  yellow: {
    light: `#CA8A04`,
    dark: `#FACC15`,
  },
  lime: {
    light: `#65A30D`,
    dark: `#A3E635`,
  },
  green: {
    light: `#16A34A`,
    dark: `#4ADE80`,
  },
  teal: {
    light: `#0F766E`,
    dark: `#2DD4BF`,
  },
  cyan: {
    light: `#0891B2`,
    dark: `#22D3EE`,
  },
  aqua: {
    light: `#0891B2`,
    dark: `#22D3EE`,
  },
  blue: {
    light: `#2563EB`,
    dark: `#60A5FA`,
  },
  indigo: {
    light: `#4F46E5`,
    dark: `#818CF8`,
  },
  violet: {
    light: `#7C3AED`,
    dark: `#A78BFA`,
  },
  purple: {
    light: `#9333EA`,
    dark: `#C084FC`,
  },
  fuchsia: {
    light: `#C026D3`,
    dark: `#E879F9`,
  },
  magenta: {
    light: `#C026D3`,
    dark: `#E879F9`,
  },
  pink: {
    light: `#DB2777`,
    dark: `#F472B6`,
  },
  gray: {
    light: `#4B5563`,
    dark: `#9CA3AF`,
  },
  grey: {
    light: `#4B5563`,
    dark: `#9CA3AF`,
  },
};
function _e(e, t) {
  let n = e?.trim();
  if (n) {
    return R[n.toLowerCase()]?.[t] ?? n;
  }
  if (t === `light`) {
    return `#4B5563`;
  }
  return `#9CA3AF`;
}
function ve(e, t) {
  let n = e[0]?.time;
  if (n === undefined) {
    return t;
  }
  return t.filter((e) => e.time >= n);
}
function ye(e, t) {
  if (!e.length) {
    return t;
  }
  let n = ve(e, t);
  let r = new Map(n.map((e) => [e.time, e]));
  let i = n.length ? n[n.length - 1].time : null;
  let time = e[e.length - 1].time;
  let o = [];
  for (let t of e) {
    if (i === null || t.time > i) {
      break;
    }
    o.push(
      r.get(t.time) ?? {
        time: t.time,
      },
    );
  }
  for (let e of n) {
    if (e.time > time) {
      o.push(e);
    }
  }
  return o;
}
function be(e, t, n) {
  if (n <= 0 || t <= e) {
    return [];
  }
  let r = [];
  for (let i = e + n; i < t; i += n) {
    r.push(i);
  }
  return r;
}
function xe(e, t) {
  let n = new Set(e);
  if (n.has(t)) {
    n.delete(t);
  } else {
    n.add(t);
  }
  return n;
}
function Se(e) {
  let t = {
    candle: false,
    panes: [],
    hiddenLines: [],
  };
  if (!e) {
    return t;
  }
  try {
    let t = JSON.parse(e);
    return {
      candle: !!t?.candle,
      panes: Array.isArray(t?.panes)
        ? t.panes.filter((e) => typeof e == `string`)
        : [],
      hiddenLines: Array.isArray(t?.hiddenLines)
        ? t.hiddenLines.filter((e) => typeof e == `string`)
        : [],
    };
  } catch {
    return t;
  }
}
export function o(e) {
  if (typeof e == `number`) {
    if (Number.isFinite(e)) {
      return e;
    }
    return null;
  }
  if (!e || typeof e != `object`) {
    return null;
  }
  if (`year` in e && `month` in e && `day` in e) {
    let t = e;
    let n = Date.UTC(t.year, t.month - 1, t.day);
    if (Number.isFinite(n)) {
      return Math.floor(n / 1000);
    }
    return null;
  }
  if (e instanceof Date) {
    let t = e.getTime();
    if (Number.isFinite(t)) {
      return Math.floor(t / 1000);
    }
    return null;
  }
  return null;
}
export function u(e, t) {
  if (!e || typeof e != `object`) {
    return `Candle at index ${t} is not a valid object`;
  }
  let n = e;
  for (let e of [`time`, `open`, `high`, `low`, `close`]) {
    if (!(e in n)) {
      return `Candle at index ${t} is missing required field: ${e}`;
    }
    if (e === `time`) {
      if (o(n.time) === null) {
        return `Candle at index ${t} has invalid time format`;
      }
    } else if (typeof n[e] != `number` || !Number.isFinite(n[e])) {
      return `Candle at index ${t} has invalid ${e} value (expected number, got ${typeof n[e]})`;
    }
  }
  return null;
}
function Ce(e) {
  if (!Array.isArray(e)) {
    return `Candle data is not an array`;
  }
  if (e.length === 0) {
    return null;
  }
  let t = [
    ...e.slice(0, 5).map((e, t) => t),
    ...e.slice(-5).map((t, n) => e.length - 5 + n),
  ].filter((t, n, r) => r.indexOf(t) === n && t >= 0 && t < e.length);
  for (let n of t) {
    let t = u(e[n], n);
    if (t) {
      return t;
    }
  }
  return null;
}
export function r(e) {
  return Array.isArray(e) && e.length > 0;
}
function we(e) {
  let t = {
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };
  let n = e.match(/^(\d+)([mhdw])$/);
  if (!n) {
    return 60;
  }
  let r = Number.parseInt(n[1]);
  if (r > 0) {
    return r * t[n[2]];
  }
  return 60;
}
function H(e, t) {
  let n = Math.floor(e / 1000);
  let r = we(t);
  return Math.floor(n / r) * r;
}
export function s(e, t) {
  let n = e.side?.toLowerCase() || `buy`;
  return {
    time: H(e.executed_at, t),
    position: n === `buy` ? `belowBar` : `aboveBar`,
    color: n === `buy` ? `#2196F3` : `#e91e63`,
    shape: n === `buy` ? `arrowUp` : `arrowDown`,
    text: n.toUpperCase(),
    order_id: e.id,
  };
}
function Te(e, t) {
  if (!e.length) {
    return [];
  }
  let time = e[0].time;
  let time_1 = e[e.length - 1].time;
  return t.filter((e) => e.time >= time && e.time <= time_1);
}
export function i(e) {
  return {
    id: e.id,
    strategy_name: e.strategy_name,
    symbol: e.symbol,
    exchange: e.exchange,
    type: e.type.toLowerCase() === `short` ? `short` : `long`,
    entry_price: e.entry_price,
    exit_price: Number(e.exit_price ?? e.entry_price),
    qty: e.qty,
    opened_at: e.opened_at,
    closed_at: e.closed_at === null ? null : Number(e.closed_at),
    fee: Number(e.fee ?? 0),
    size: e.size,
    PNL: Number(e.pnl ?? 0),
    PNL_percentage: Number(e.pnl_percentage ?? 0),
    holding_period: Number(e.holding_period ?? 0),
    orders: e.orders.map((e) => ({
      id: e.id,
      session_id: null,
      exchange_id: e.exchange_id,
      symbol: e.symbol,
      side: e.side.toLowerCase() === `sell` ? `sell` : `buy`,
      type: e.type,
      qty: e.qty,
      filled_qty: e.filled_qty,
      price: e.price,
      status: e.status,
      created_at: e.created_at,
      canceled_at: e.canceled_at,
      executed_at: e.executed_at,
    })),
  };
}
export function a(e, t) {
  return Ee(Array.from(new Map(e.map((e) => [e.order_id, e])).values())).slice(
    -t,
  );
}
function Ee(e) {
  return [...e].sort((e, t) => e.time - t.time);
}
function K(e, t, n, r, i) {
  let a = (e) => Math.floor(e / 1000 / i) * i;
  let o = a(e);
  let s = a(n);
  if (s <= o) {
    s = o + i;
  }
  return [
    {
      time: o,
      value: t,
    },
    {
      time: s,
      value: r,
    },
  ];
}
function De(e, t, color) {
  let r = new Set(t);
  return e.map((e) => {
    if (r.has(e.order_id)) {
      return {
        ...e,
        color,
      };
    }
    return e;
  });
}
const q = r_1(E_2(), 1);
const Oe = [`onKeydown`];
const ke = {
  class: `grid grid-cols-[20px_minmax(70px,1fr)_52px_64px_28px] grid-rows-2 gap-x-2 gap-y-1.5 items-center`,
};
const Ae = {
  class: `row-span-2 flex items-center justify-center text-gray-400`,
};
const J = {
  class: `truncate font-medium tabular-nums text-gray-700 dark:text-gray-200`,
};
const je = {
  class: `row-span-2 flex items-center justify-center`,
};
const Me = [`aria-label`];
const Ne = {
  class: `col-span-3 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 overflow-hidden`,
};
const Pe = {
  class: `truncate`,
};
const Y = {
  class: `shrink-0`,
};
const Fe = {
  key: 0,
  class: `border-t border-gray-200 bg-gray-50/80 px-2 py-2 dark:border-gray-700 dark:bg-gray-950/30`,
};
const Ie = {
  class: `flex items-center justify-between px-1 pb-1.5`,
};
const Le = {
  class: `rounded-full bg-gray-200/70 px-2 py-0.5 text-[9px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400`,
};
const Re = [`onMouseenter`, `onClick`, `onKeydown`];
const ze = {
  class: `min-w-0 flex-1`,
};
const Be = {
  class: `flex items-center gap-1.5`,
};
const Ve = {
  class: `truncate font-semibold tabular-nums text-gray-700 dark:text-gray-200`,
};
const He = {
  class: `mt-0.5 flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-500`,
};
const Ue = {
  class: `uppercase`,
};
const We = {
  class: `truncate`,
};
const Ge = {
  class: `shrink-0 text-right`,
};
const Ke = [`onClick`];
const qe = {
  class: `p-4`,
};
const Je = {
  class: `mt-4`,
};
const Ye = {
  class: `w-full text-sm`,
};
const Xe = {
  class: `w-full`,
};
const Ze = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const Qe = {
  class: `w-full flex justify-between py-2 px-4`,
};
const $e = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const et = {
  class: `w-full flex justify-between py-2 px-4`,
};
const tt = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const nt = {
  class: `w-full flex justify-between py-2 px-4`,
};
const rt = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const it = {
  class: `w-full flex justify-between py-2 px-4`,
};
const at = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const X = {
  class: `w-full`,
};
const Z = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const ot = {
  class: `w-full flex justify-between py-2 px-4`,
};
const st = {
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const Q = {
  key: 0,
  class: `w-full flex justify-between py-2 px-4`,
};
const $ = {
  key: 1,
  class: `w-full flex justify-between bg-gray-50 dark:bg-gray-800 py-2 px-4`,
};
const ct = {
  key: 2,
  class: `w-full flex justify-between py-2 px-4`,
};
const lt = {
  class: `flex justify-end mt-4`,
};
const ut = Object.assign(
  k({
    __name: `ChartOrders`,
    props: {
      trade: {},
      navigationDetails: {},
    },
    emits: [`zoom`, `highlight`, `unhighlight`],
    setup(e, { emit }) {
      let i = emit;
      let a = vn(null);
      let d = vn(false);
      let f = e;
      let p = vn(false);
      function m() {
        p.value = !p.value;
        let e = f.trade.orders[0];
        if (e) {
          i(`zoom`, {
            orderId: e.id,
            tradeId: f.trade.id,
          });
        }
      }
      return (t, f) => {
        let y = i_1;
        let ee = n;
        let ne = t_2;
        let b = t_1;
        mt_1();
        return b_1(
          o_1,
          null,
          [
            __1(
              `div`,
              {
                class: Qn([
                  `mb-2 w-full overflow-hidden rounded-xl border bg-white dark:bg-gray-900`,
                  On(p)
                    ? `border-indigo-300 dark:border-indigo-400`
                    : `border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700`,
                ]),
                onMouseleave: (f[2] ||= (e) => i(`unhighlight`)),
              },
              [
                __1(
                  `div`,
                  {
                    role: `button`,
                    tabindex: `0`,
                    class: Qn([
                      `group w-full cursor-pointer px-2 py-2 text-xs hover:bg-gray-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/50 dark:hover:bg-gray-800/80`,
                      On(p) ? `bg-indigo-50/30 dark:bg-indigo-950/10` : ``,
                    ]),
                    onClick: m,
                    onKeydown: [
                      Jt_1(m, [`enter`]),
                      Jt_1(Yt_1(m, [`prevent`]), [`space`]),
                    ],
                    onMouseenter: (f[1] ||= (t) =>
                      i(`highlight`, {
                        orderIds: e.trade.orders.map((e) => e.id),
                        tradeId: e.trade.id,
                      })),
                  },
                  [
                    __1(`div`, ke, [
                      __1(`div`, Ae, [
                        D_1(
                          y,
                          {
                            name: On(p)
                              ? `i-heroicons-chevron-down`
                              : `i-heroicons-chevron-right`,
                            class: `size-4`,
                          },
                          null,
                          8,
                          [`name`],
                        ),
                      ]),
                      __1(
                        `div`,
                        J,
                        nr(On(w).roundPrice(e.trade.entry_price)),
                        1,
                      ),
                      __1(
                        `div`,
                        {
                          class: Qn([
                            `truncate text-right`,
                            e.trade.type.toLowerCase() === `long`
                              ? `text-emerald-500`
                              : `text-rose-500`,
                          ]),
                        },
                        nr(On(q.default).round(e.trade.qty, 2)),
                        3,
                      ),
                      __1(
                        `div`,
                        {
                          class: Qn([
                            `justify-self-end rounded-md px-1.5 py-1 text-[11px] font-semibold`,
                            e.trade.PNL_percentage > 0
                              ? `bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400`
                              : `bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400`,
                          ]),
                        },
                        nr(On(q.default).round(e.trade.PNL_percentage, 2)) +
                          `% `,
                        3,
                      ),
                      __1(`div`, je, [
                        D_1(
                          ee,
                          {
                            text:
                              e.navigationDetails?.message ?? `Jump to trade`,
                            arrow: ``,
                          },
                          {
                            default: qt_1(() => [
                              __1(
                                `button`,
                                {
                                  class: Qn([
                                    `size-7 rounded-lg hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center`,
                                    e.navigationDetails?.warning
                                      ? `bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400`
                                      : `text-gray-400 hover:text-indigo-500`,
                                  ]),
                                  "aria-label":
                                    e.navigationDetails?.message ??
                                    `Jump to trade`,
                                  onClick: (f[0] ||= Yt_1(
                                    (t) =>
                                      i(`zoom`, {
                                        tradeId: e.trade.id,
                                        time: Math.floor(
                                          e.trade.opened_at / 1000,
                                        ),
                                      }),
                                    [`stop`],
                                  )),
                                },
                                [
                                  D_1(y, {
                                    name: `i-heroicons-arrow-right`,
                                    class: `size-4`,
                                  }),
                                ],
                                10,
                                Me,
                              ),
                            ]),
                            _: 1,
                          },
                          8,
                          [`text`],
                        ),
                      ]),
                      __1(`div`, Ne, [
                        __1(
                          `span`,
                          {
                            class: Qn([
                              e.trade.type.toLowerCase() === `long`
                                ? `text-emerald-500`
                                : `text-rose-500`,
                              `font-semibold uppercase`,
                            ]),
                          },
                          nr(e.trade.type),
                          3,
                        ),
                        (f[5] ||= __1(
                          `span`,
                          {
                            class: `opacity-40`,
                          },
                          `•`,
                          -1,
                        )),
                        __1(
                          `span`,
                          Pe,
                          nr(
                            On(w).timestampToReadableDateTime(
                              e.trade.opened_at,
                            ),
                          ),
                          1,
                        ),
                        (f[6] ||= __1(
                          `span`,
                          {
                            class: `opacity-40`,
                          },
                          `•`,
                          -1,
                        )),
                        __1(
                          `span`,
                          Y,
                          nr(
                            On(w).secondsToHumanReadable(
                              e.trade.holding_period,
                            ),
                          ),
                          1,
                        ),
                      ]),
                    ]),
                  ],
                  42,
                  Oe,
                ),
                On(p)
                  ? (mt_1(),
                    b_1(`div`, Fe, [
                      __1(`div`, Ie, [
                        (f[7] ||= __1(
                          `div`,
                          {
                            class: `text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500`,
                          },
                          `Executions`,
                          -1,
                        )),
                        __1(
                          `div`,
                          Le,
                          nr(e.trade.orders.length) +
                            ` ` +
                            nr(
                              e.trade.orders.length === 1 ? `order` : `orders`,
                            ),
                          1,
                        ),
                      ]),
                      (mt_1(true),
                      b_1(
                        o_1,
                        null,
                        bt_1(e.trade.orders, (t) => {
                          mt_1();
                          return b_1(
                            `div`,
                            {
                              key: t.id,
                              role: `button`,
                              tabindex: `0`,
                              class: `group/order mb-1 flex cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-white/70 px-2 py-2 text-[10px] last:mb-0 hover:border-gray-200 hover:bg-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:bg-gray-900/60 dark:hover:border-gray-700 dark:hover:bg-gray-900`,
                              onMouseenter: (n) =>
                                i(`highlight`, {
                                  orderIds: [t.id],
                                  tradeId: e.trade.id,
                                }),
                              onClick: (e) => {
                                a.value = t;
                                d.value = true;
                              },
                              onKeydown: [
                                Jt_1(
                                  (e) => {
                                    a.value = t;
                                    d.value = true;
                                  },
                                  [`enter`],
                                ),
                                Jt_1(
                                  Yt_1(
                                    (e) => {
                                      a.value = t;
                                      d.value = true;
                                    },
                                    [`prevent`],
                                  ),
                                  [`space`],
                                ),
                              ],
                            },
                            [
                              __1(
                                `div`,
                                {
                                  class: Qn([
                                    `flex size-7 shrink-0 items-center justify-center rounded-lg`,
                                    t.side === `buy`
                                      ? `bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400`
                                      : `bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400`,
                                  ]),
                                },
                                [
                                  D_1(
                                    y,
                                    {
                                      name:
                                        t.side === `buy`
                                          ? `i-heroicons-arrow-up-right`
                                          : `i-heroicons-arrow-down-right`,
                                      class: `size-3.5`,
                                    },
                                    null,
                                    8,
                                    [`name`],
                                  ),
                                ],
                                2,
                              ),
                              __1(`div`, ze, [
                                __1(`div`, Be, [
                                  __1(
                                    `span`,
                                    Ve,
                                    nr(On(w).roundPrice(t.price)),
                                    1,
                                  ),
                                  __1(
                                    `span`,
                                    {
                                      class: Qn([
                                        `rounded-sm px-1 py-0.5 text-[8px] font-semibold uppercase`,
                                        t.side === `buy`
                                          ? `bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400`
                                          : `bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400`,
                                      ]),
                                    },
                                    nr(t.side),
                                    3,
                                  ),
                                ]),
                                __1(`div`, He, [
                                  __1(`span`, Ue, nr(t.type), 1),
                                  (f[8] ||= __1(
                                    `span`,
                                    {
                                      class: `opacity-40`,
                                    },
                                    `•`,
                                    -1,
                                  )),
                                  __1(
                                    `span`,
                                    We,
                                    nr(
                                      On(q.default).startCase(
                                        t.status.toLowerCase(),
                                      ),
                                    ),
                                    1,
                                  ),
                                ]),
                              ]),
                              __1(`div`, Ge, [
                                __1(
                                  `div`,
                                  {
                                    class: Qn([
                                      `font-medium tabular-nums`,
                                      t.side === `buy`
                                        ? `text-emerald-500`
                                        : `text-rose-500`,
                                    ]),
                                  },
                                  nr(On(q.default).round(t.qty, 2)),
                                  3,
                                ),
                                (f[9] ||= __1(
                                  `div`,
                                  {
                                    class: `mt-0.5 text-[8px] uppercase tracking-wide text-gray-400 dark:text-gray-500`,
                                  },
                                  `Qty`,
                                  -1,
                                )),
                              ]),
                              __1(
                                `button`,
                                {
                                  class: `flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400`,
                                  title: `Jump to order`,
                                  onClick: Yt_1(
                                    (n) =>
                                      i(`zoom`, {
                                        orderId: t.id,
                                        tradeId: e.trade.id,
                                      }),
                                    [`stop`],
                                  ),
                                },
                                [
                                  D_1(y, {
                                    name: `i-heroicons-viewfinder-circle`,
                                    class: `size-3.5`,
                                  }),
                                ],
                                8,
                                Ke,
                              ),
                            ],
                            40,
                            Re,
                          );
                        }),
                        128,
                      )),
                    ]))
                  : y_1(``, true),
              ],
              34,
            ),
            D_1(
              b,
              {
                open: On(d),
                "onUpdate:open": (f[4] ||= (e) => {
                  if (un(d)) {
                    return (d.value = e);
                  }
                  return null;
                }),
              },
              {
                content: qt_1(() => [
                  __1(`div`, qe, [
                    __1(`div`, Je, [
                      __1(`div`, Ye, [
                        (f[25] ||= __1(
                          `h2`,
                          {
                            class: `text-lg mb-2 font-bold italic dark:text-white text-center`,
                          },
                          ` Trade `,
                          -1,
                        )),
                        __1(`div`, Xe, [
                          __1(`div`, Ze, [
                            (f[10] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Entry Price`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(On(w).roundPrice(e.trade.entry_price)),
                              1,
                            ),
                          ]),
                          __1(`div`, Qe, [
                            (f[11] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Exit Price`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(On(w).roundPrice(e.trade.exit_price)),
                              1,
                            ),
                          ]),
                          __1(`div`, $e, [
                            (f[12] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Qty`,
                              -1,
                            )),
                            __1(`div`, null, nr(e.trade.qty), 1),
                          ]),
                          __1(`div`, et, [
                            (f[13] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Size`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(On(w).roundPrice(e.trade.size)),
                              1,
                            ),
                          ]),
                          __1(`div`, tt, [
                            (f[14] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `PNL`,
                              -1,
                            )),
                            __1(
                              `div`,
                              {
                                class: Qn([
                                  e.trade.PNL > 0
                                    ? `text-green-500`
                                    : `text-red-500`,
                                ]),
                              },
                              nr(On(q.default).round(e.trade.PNL, 2)) +
                                ` (` +
                                nr(
                                  On(q.default).round(
                                    e.trade.PNL_percentage,
                                    2,
                                  ),
                                ) +
                                `%) `,
                              3,
                            ),
                          ]),
                          __1(`div`, nt, [
                            (f[15] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Fee`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(On(q.default).round(e.trade.fee, 2)),
                              1,
                            ),
                          ]),
                          __1(`div`, rt, [
                            (f[16] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Holding Period`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(
                                On(w).secondsToHumanReadable(
                                  e.trade.holding_period,
                                ),
                              ),
                              1,
                            ),
                          ]),
                          __1(`div`, it, [
                            (f[17] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Opened At`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(new Date(e.trade.opened_at).toLocaleString()),
                              1,
                            ),
                          ]),
                          __1(`div`, at, [
                            (f[18] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Closed At`,
                              -1,
                            )),
                            __1(
                              `div`,
                              null,
                              nr(
                                e.trade.closed_at === null
                                  ? `-`
                                  : new Date(
                                      e.trade.closed_at,
                                    ).toLocaleString(),
                              ),
                              1,
                            ),
                          ]),
                        ]),
                        (f[26] ||= __1(
                          `h2`,
                          {
                            class: `text-lg font-bold italic dark:text-white mt-6 mb-2 text-center`,
                          },
                          ` Order `,
                          -1,
                        )),
                        __1(`div`, X, [
                          __1(`div`, Z, [
                            (f[19] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Side`,
                              -1,
                            )),
                            __1(
                              `div`,
                              {
                                class: Qn([
                                  On(a)?.side === `buy`
                                    ? `text-green-500`
                                    : `text-red-500`,
                                ]),
                              },
                              nr(On(a)?.side?.toUpperCase()),
                              3,
                            ),
                          ]),
                          __1(`div`, ot, [
                            (f[20] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Type`,
                              -1,
                            )),
                            __1(`div`, null, nr(On(a)?.type), 1),
                          ]),
                          __1(`div`, st, [
                            (f[21] ||= __1(
                              `div`,
                              {
                                class: `font-bold`,
                              },
                              `Qty`,
                              -1,
                            )),
                            __1(`div`, null, nr(On(a)?.qty), 1),
                          ]),
                          On(a)?.created_at
                            ? (mt_1(),
                              b_1(`div`, Q, [
                                (f[22] ||= __1(
                                  `div`,
                                  {
                                    class: `font-bold`,
                                  },
                                  `Created At`,
                                  -1,
                                )),
                                __1(
                                  `div`,
                                  null,
                                  nr(
                                    new Date(
                                      On(a)?.created_at,
                                    ).toLocaleString(),
                                  ),
                                  1,
                                ),
                              ]))
                            : y_1(``, true),
                          On(a)?.executed_at
                            ? (mt_1(),
                              b_1(`div`, $, [
                                (f[23] ||= __1(
                                  `div`,
                                  {
                                    class: `font-bold`,
                                  },
                                  `Executed At`,
                                  -1,
                                )),
                                __1(
                                  `div`,
                                  null,
                                  nr(
                                    new Date(
                                      On(a)?.executed_at,
                                    ).toLocaleString(),
                                  ),
                                  1,
                                ),
                              ]))
                            : y_1(``, true),
                          On(a)?.canceled_at
                            ? (mt_1(),
                              b_1(`div`, ct, [
                                (f[24] ||= __1(
                                  `div`,
                                  {
                                    class: `font-bold`,
                                  },
                                  `Canceled At`,
                                  -1,
                                )),
                                __1(
                                  `div`,
                                  null,
                                  nr(
                                    new Date(
                                      On(a)?.canceled_at,
                                    ).toLocaleString(),
                                  ),
                                  1,
                                ),
                              ]))
                            : y_1(``, true),
                        ]),
                      ]),
                      __1(`div`, lt, [
                        D_1(
                          ne,
                          {
                            color: `neutral`,
                            variant: `subtle`,
                            block: ``,
                            onClick: (f[3] ||= (e) => (d.value = false)),
                          },
                          {
                            default: qt_1(() => [
                              ...(f[27] ||= [E(` Close `, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                      ]),
                    ]),
                  ]),
                ]),
                _: 1,
              },
              8,
              [`open`],
            ),
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `BacktestChartOrders`,
  },
);
const dt = [`aria-hidden`];
const ft = {
  class: `h-full w-80 min-h-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs flex flex-col dark:border-gray-700 dark:bg-gray-900`,
};
const pt = {
  class: `shrink-0 border-b border-gray-200 px-4 pt-4 pb-3 dark:border-gray-700`,
};
const mt = {
  class: `flex items-center justify-between gap-3`,
};
const ht = {
  class: `min-w-0`,
};
const gt = {
  class: `text-xs text-gray-400 dark:text-gray-500`,
};
const _t = {
  class: `grid grid-cols-3 gap-2 mt-3`,
};
const vt = {
  class: `rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-center dark:border-gray-700 dark:bg-gray-800/70`,
};
const yt = {
  class: `mt-0.5 text-sm font-semibold text-gray-700 dark:text-gray-200`,
};
const bt = {
  class: `rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-center dark:border-gray-700 dark:bg-gray-800/70`,
};
const xt = {
  class: `mt-0.5 text-sm font-semibold text-emerald-500`,
};
const St = {
  class: `rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-center dark:border-gray-700 dark:bg-gray-800/70`,
};
const Ct = {
  class: `mt-0.5 text-sm font-semibold text-rose-500`,
};
const wt = {
  class: `min-h-0 flex-1 overflow-y-auto p-2`,
};
const Tt = {
  key: 1,
  class: `relative h-full flex items-center justify-center overflow-hidden px-8 text-center`,
};
const Et = {
  class: `relative`,
};
const Dt = {
  class: `mx-auto size-16 rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-xs rotate-3 dark:border-indigo-900 dark:bg-indigo-950/50`,
};
const Ot = Object.assign(
  k({
    __name: `ChartSidebar`,
    props: $_1(
      {
        items: {},
        navigationDetails: {
          type: Function,
        },
      },
      {
        modelValue: {
          type: Boolean,
          default: false,
        },
        modelModifiers: {},
      },
    ),
    emits: $_1([`zoom`, `highlight`, `unhighlight`], [`update:modelValue`]),
    setup(e, { emit }) {
      let a = Ft_1(e, `modelValue`);
      let d = emit;
      let f = e;
      let m = vn(null);
      let v = g_1(() => {
        if (m.value === `desc`) {
          return `Best first`;
        }
        if (m.value === `asc`) {
          return `Worst first`;
        }
        return `Recent`;
      });
      let y = g_1(() => f.items.filter((e) => e.PNL > 0).length);
      let ee = g_1(() => f.items.filter((e) => e.PNL < 0).length);
      let te = g_1(() => {
        if (f.items.length) {
          return Math.round((y.value / f.items.length) * 100);
        }
        return 0;
      });
      function re() {
        m.value = m.value === null ? `desc` : m.value === `desc` ? `asc` : null;
      }
      let x = g_1(() => {
        if (!m.value) {
          return f.items;
        }
        let e = m.value === `desc` ? -1 : 1;
        return [...f.items].sort(
          (t, n) => e * (t.PNL_percentage - n.PNL_percentage),
        );
      });
      return (t, i) => {
        let f = t_2;
        let p = ut;
        let m = i_1;
        mt_1();
        return b_1(
          `aside`,
          {
            class: Qn([
              `h-full min-h-0 shrink-0 overflow-hidden`,
              a.value
                ? `w-80 opacity-100`
                : `w-0 opacity-0 pointer-events-none`,
            ]),
            "aria-hidden": !a.value,
          },
          [
            __1(`div`, ft, [
              e.items.length > 0
                ? (mt_1(),
                  b_1(
                    o_1,
                    {
                      key: 0,
                    },
                    [
                      __1(`div`, pt, [
                        __1(`div`, mt, [
                          __1(`div`, ht, [
                            (i[4] ||= __1(
                              `h3`,
                              {
                                class: `text-sm font-semibold text-gray-900 dark:text-white`,
                              },
                              `Trade activity`,
                              -1,
                            )),
                            __1(
                              `p`,
                              gt,
                              nr(e.items.length) +
                                ` completed ` +
                                nr(e.items.length === 1 ? `trade` : `trades`),
                              1,
                            ),
                          ]),
                          D_1(
                            f,
                            {
                              class: `shrink-0 transition-none`,
                              color: `neutral`,
                              variant: `soft`,
                              size: `xs`,
                              icon: `i-heroicons-arrows-up-down`,
                              label: On(v),
                              title: `Change trade sorting`,
                              onClick: (i[0] ||= (e) => re()),
                            },
                            null,
                            8,
                            [`label`],
                          ),
                        ]),
                        __1(`div`, _t, [
                          __1(`div`, vt, [
                            (i[5] ||= __1(
                              `div`,
                              {
                                class: `text-[10px] uppercase tracking-wide text-gray-400`,
                              },
                              `Win rate`,
                              -1,
                            )),
                            __1(`div`, yt, nr(On(te)) + `%`, 1),
                          ]),
                          __1(`div`, bt, [
                            (i[6] ||= __1(
                              `div`,
                              {
                                class: `text-[10px] uppercase tracking-wide text-gray-400`,
                              },
                              `Wins`,
                              -1,
                            )),
                            __1(`div`, xt, nr(On(y)), 1),
                          ]),
                          __1(`div`, St, [
                            (i[7] ||= __1(
                              `div`,
                              {
                                class: `text-[10px] uppercase tracking-wide text-gray-400`,
                              },
                              `Losses`,
                              -1,
                            )),
                            __1(`div`, Ct, nr(On(ee)), 1),
                          ]),
                        ]),
                      ]),
                      (i[8] ||= __1(
                        `div`,
                        {
                          class: `grid grid-cols-[20px_minmax(70px,1fr)_52px_64px_28px] gap-2 items-center border-b border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500`,
                        },
                        [
                          __1(`div`),
                          __1(`div`, null, `Entry`),
                          __1(
                            `div`,
                            {
                              class: `text-right`,
                            },
                            `Qty`,
                          ),
                          __1(
                            `div`,
                            {
                              class: `text-right`,
                            },
                            `Return`,
                          ),
                          __1(`div`),
                        ],
                        -1,
                      )),
                      __1(`div`, wt, [
                        (mt_1(true),
                        b_1(
                          o_1,
                          null,
                          bt_1(On(x), (t) => {
                            mt_1();
                            return v_1(
                              p,
                              {
                                key: t.id,
                                trade: t,
                                "navigation-details": e.navigationDetails?.(t),
                                onZoom: (i[1] ||= (e) => d(`zoom`, e)),
                                onHighlight: (i[2] ||= (e) =>
                                  d(`highlight`, e)),
                                onUnhighlight: (i[3] ||= (e) =>
                                  d(`unhighlight`)),
                              },
                              null,
                              8,
                              [`trade`, `navigation-details`],
                            );
                          }),
                          128,
                        )),
                      ]),
                    ],
                    64,
                  ))
                : (mt_1(),
                  b_1(`div`, Tt, [
                    (i[12] ||= __1(
                      `div`,
                      {
                        class: `absolute -top-16 -left-12 size-44 rounded-full bg-indigo-100/50 dark:bg-indigo-950/20 blur-3xl`,
                      },
                      null,
                      -1,
                    )),
                    (i[13] ||= __1(
                      `div`,
                      {
                        class: `absolute -bottom-20 -right-12 size-48 rounded-full bg-cyan-100/50 dark:bg-cyan-950/20 blur-3xl`,
                      },
                      null,
                      -1,
                    )),
                    __1(`div`, Et, [
                      __1(`div`, Dt, [
                        D_1(m, {
                          name: `i-heroicons-presentation-chart-line`,
                          class: `size-8 -rotate-3`,
                        }),
                      ]),
                      (i[9] ||= __1(
                        `h3`,
                        {
                          class: `mt-5 text-sm font-semibold text-gray-900 dark:text-white`,
                        },
                        `No trades to show`,
                        -1,
                      )),
                      (i[10] ||= __1(
                        `p`,
                        {
                          class: `mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400 whitespace-normal`,
                        },
                        ` Price action is ready. Completed trades and their orders will appear here for this route. `,
                        -1,
                      )),
                      (i[11] ||= __1(
                        `div`,
                        {
                          class: `mt-4 inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400`,
                        },
                        [
                          __1(`span`, {
                            class: `size-1.5 rounded-full bg-gray-400`,
                          }),
                          E(` 0 completed trades `),
                        ],
                        -1,
                      )),
                    ]),
                  ])),
            ]),
          ],
          10,
          dt,
        );
      };
    },
  }),
  {
    __name: `BacktestChartSidebar`,
  },
);
n_2.Normal;
function kt() {
  return {
    autoSize: true,
    crosshair: {
      mode: n_2.Normal,
    },
  };
}
const At = {
  chart: {
    layout: {
      background: {
        color: `#ffffff`,
      },
      textColor: `rgba(33, 56, 77, 1)`,
    },
    grid: {
      vertLines: {
        color: `#f1f1f1`,
        visible: false,
      },
      horzLines: {
        color: `#f1f1f1`,
        visible: false,
      },
    },
    rightPriceScale: {
      borderColor: `rgba(197, 203, 206, 0.6)`,
    },
    timeScale: {
      borderColor: `rgba(197, 203, 206, 0.6)`,
      timeVisible: true,
      secondsVisible: false,
    },
  },
  series: {
    color: `#4f46e5`,
  },
};
const jt = {
  chart: {
    layout: {
      background: {
        color: `rgb(29 25 23)`,
      },
      textColor: `#D1D5DB`,
    },
    grid: {
      vertLines: {
        color: `#525252`,
        visible: false,
      },
      horzLines: {
        color: `#525252`,
        visible: false,
      },
    },
    rightPriceScale: {
      borderColor: `#525252`,
    },
    timeScale: {
      borderColor: `#525252`,
      timeVisible: true,
      secondsVisible: false,
    },
  },
  series: {
    color: `#818CF8`,
  },
};
const Mt = {
  class: `w-full flex flex-col h-full min-h-0 overflow-hidden border dark:border-gray-800`,
};
const Nt = {
  key: 1,
  class: `w-full shrink-0 flex items-stretch`,
};
const Pt = {
  class: `font-medium uppercase`,
};
const Ft = {
  key: 0,
  class: `absolute top-2 left-2 z-10 pointer-events-none rounded-sm bg-white/75 dark:bg-gray-900/75 px-2 py-1 text-xs space-y-0.5`,
};
const It = {
  class: `flex flex-wrap gap-x-2 gap-y-0.5`,
};
const Lt = {
  class: `text-gray-400 dark:text-gray-500`,
};
const Rt = [`aria-pressed`, `title`, `onClick`];
const zt = {
  key: 0,
  class: `text-gray-600 dark:text-gray-300`,
};
const Bt = {
  key: 1,
  class: `text-gray-400 dark:text-gray-500`,
};
const Vt = {
  key: 1,
  class: `absolute top-1 right-[90px] z-10 flex gap-1`,
};
const Ht = [`onClick`, `onDblclick`];
const Ut = {
  class: `font-medium uppercase`,
};
const Wt = 120;
const Gt = `jesse.chart-panes.`;
const Kt = Object.assign(
  k({
    __name: `InteractiveChart`,
    props: {
      candles: {},
      watermark: {},
      paneStateKey: {},
      lines: {},
      extraCharts: {},
      horizontalLines: {},
      horizontalExtraLines: {},
      markers: {},
      showLastPrice: {
        type: Boolean,
        default: true,
      },
    },
    emits: [`ready`],
    setup(e, { expose, emit }) {
      let i = f_1();
      let m = e;
      let te = emit;
      let S = vn();
      let ae = vn([]);
      let w = null;
      let T = null;
      let E = [];
      let D = [];
      let O = null;
      let ce = 0;
      let le = 2;
      let k = [];
      let A = new Map();
      let j = null;
      let M = null;
      let N = new Map();
      let P = new Map();
      let F = new Map();
      let I = new Map();
      let L = vn(new Set());
      let R = vn(new Set());
      let z = vn(false);
      let B = vn(null);
      let Ce = vn({});
      let V = vn([]);
      let we = g_1(() => {
        if (V.value.length) {
          return `Invalid numeric values were received for ${V.value.map((e) => `"${e}"`).join(`, `)} and were skipped. Check the values passed from your strategy's update_chart() method.`;
        }
        return null;
      });
      let H = g_1(() => Object.keys(m.extraCharts ?? {}));
      let U = g_1(() => z.value && H.value.length > 0);
      let Te = g_1(() => H.value.some((e) => !L.value.has(e)));
      let W = g_1(() => i.value);
      function G(e) {
        return _e(e, W.value === `light` ? `light` : `dark`);
      }
      function K(e) {
        return G(e.data?.[e.data.length - 1]?.color ?? e.color);
      }
      function De(e) {
        return {
          ...e,
          color: G(e.color),
        };
      }
      Ht_1(W, (e) => {
        dt(e);
      });
      Ht_1([() => m.candles, () => H.value.join(`|`)], () => {
        q();
      });
      ct_1(() => {
        q();
      });
      ft_1(() => {
        ce++;
        ut();
      });
      async function q() {
        let e = ++ce;
        ut();
        V.value = [];
        Qe();
        await tt_1();
        if (e === ce) {
          Oe();
        }
      }
      function Oe() {
        let m_candles = m.candles;
        if (!S.value || !m_candles?.length) {
          return;
        }
        k = [...m_candles];
        A = new Map(m_candles.map((e) => [e.time, e]));
        j = k[k.length - 1]?.time ?? null;
        w = t_6(S.value, kt());
        w.applyOptions({
          rightPriceScale: {
            minimumWidth: 80,
          },
          watermark: {
            visible: H.value.length === 0,
            fontSize: 16,
            horzAlign: `left`,
            vertAlign: `bottom`,
            color: `#888`,
            text: m.watermark,
          },
        });
        T = w.addCandlestickSeries();
        T.setData(k);
        if (m.markers?.length) {
          T.setMarkers(Re(m.markers));
        }
        let t = pe(
          m_candles.map((e) => e.open),
          m.showLastPrice,
        );
        le = t.priceFormat.precision;
        T.applyOptions(t);
        for (let e of Object.keys(m.lines ?? {})) {
          let t = m.lines[e];
          let n = w.addLineSeries({
            ...ge(!R.value.has(e)),
            color: K(t),
          });
          n.setData(ve(k, Y(e, t.data)));
          N.set(e, {
            series: n,
            indexed: J(e, t),
            isPane: false,
          });
        }
        Ie(`strategy`, Object.values(m.horizontalLines ?? {}));
        w.timeScale().fitContent();
        ke();
        tt();
        nt();
        dt(W.value);
        et();
        Q(null);
        $(null);
        te(`ready`);
      }
      function ke() {
        H.value.forEach((e, t) => {
          let n = ae.value[t];
          if (!n) {
            return;
          }
          let r = t_6(n, kt());
          E.push(r);
          D.push([]);
          P.set(e, new Map());
          if (!L.value.has(e)) {
            Ae(e, t);
          }
          r.applyOptions({
            rightPriceScale: {
              minimumWidth: 80,
            },
          });
        });
      }
      function Ae(e, t) {
        let n = E[t];
        if (!n || D[t]?.length) {
          return;
        }
        for (let r of Object.keys(m.extraCharts[e])) {
          let i = m.extraCharts[e][r];
          let a = n.addLineSeries({
            ...ge(),
            color: K(i),
          });
          a.setData(ye(k, Y(`${e} / ${r}`, i.data)));
          D[t].push(a);
          P.get(e).set(r, {
            series: a,
            indexed: J(r, i),
            isPane: true,
          });
        }
        let r = m.horizontalExtraLines?.[e];
        let i = D[t][0];
        if (r && i) {
          let t = Object.keys(r).map((e) => i.createPriceLine(De(r[e])));
          I.set(e, {
            series: i,
            lines: t,
          });
        }
      }
      function J(name, t) {
        let n = (t.data ?? []).filter(
          (e) => Number.isFinite(e?.time) && Number.isFinite(e?.value),
        );
        return {
          name,
          color: K(t),
          byTime: new Map(n.map((e) => [e.time, e.value])),
          last: n.length ? n[n.length - 1].value : null,
          lastTime: n.length ? n[n.length - 1].time : null,
        };
      }
      function updateCandle(e) {
        if (!T || (j !== null && e.time < j)) {
          return;
        }
        let t = e.time !== j;
        T.update(e);
        if (e.time === j && k.length) {
          k[k.length - 1] = e;
        } else {
          k.push(e);
          j = e.time;
        }
        A.set(e.time, e);
        if (t && m.markers?.length) {
          ze(m.markers);
        }
        X();
      }
      function updateLinePoint(e, t, n) {
        if (!w) {
          return;
        }
        let r = N.get(e);
        if (!r) {
          let i = n ?? {
            name: e,
            color: t.color,
            data: [],
          };
          let a = w.addLineSeries({
            ...ge(!R.value.has(e)),
            color: K(i),
          });
          a.setData(ve(k, Y(e, i.data)));
          r = {
            series: a,
            indexed: J(e, i),
            isPane: false,
          };
          N.set(e, r);
        }
        Pe(r, t, e);
      }
      function updateExtraLinePoint(e, t, n, r) {
        let i = P.get(e);
        if (!i) {
          return false;
        }
        if (L.value.has(e)) {
          return true;
        }
        let a = i.get(t);
        if (!a) {
          let o = H.value.indexOf(e);
          let s = E[o];
          if (!s) {
            return false;
          }
          let c = r ?? {
            name: t,
            color: n.color,
            data: [],
          };
          let l = s.addLineSeries({
            ...ge(),
            color: K(c),
          });
          l.setData(ye(k, Y(`${e} / ${t}`, c.data)));
          D[o].push(l);
          a = {
            series: l,
            indexed: J(t, c),
            isPane: true,
          };
          i.set(t, a);
        }
        Pe(a, n, `${e} / ${t}`);
        return true;
      }
      function Pe(e, t, n) {
        if (!Number.isFinite(t?.time)) {
          Fe(n);
          return;
        }
        if (e.indexed.lastTime !== null && t.time < e.indexed.lastTime) {
          return;
        }
        if (e.isPane && e.indexed.lastTime !== null) {
          let n = me(k);
          if (n) {
            for (let time of be(e.indexed.lastTime, t.time, n)) {
              e.series.update({
                time,
              });
            }
          }
        }
        if (!Number.isFinite(t?.value)) {
          Fe(n);
          e.series.update({
            time: t.time,
          });
          e.indexed.lastTime = t.time;
          X();
          return;
        }
        let r = {
          ...t,
          color: G(t.color),
        };
        e.series.update(r);
        e.indexed.byTime.set(t.time, t.value);
        e.indexed.last = t.value;
        e.indexed.lastTime = t.time;
        e.indexed.color = r.color;
        X();
      }
      function Y(e, t) {
        let n = [];
        let r = false;
        for (let e of t ?? []) {
          if (!Number.isFinite(e?.time)) {
            r = true;
            continue;
          }
          if (!Number.isFinite(e?.value)) {
            r = true;
            n.push({
              time: e.time,
            });
            continue;
          }
          n.push({
            time: e.time,
            value: e.value,
            color: G(e.color),
          });
        }
        if (r) {
          Fe(e);
        }
        return n;
      }
      function Fe(e) {
        if (!V.value.includes(e)) {
          V.value = [...V.value, e];
        }
      }
      function Ie(e, t) {
        if (T) {
          for (let t of F.get(e) ?? []) {
            T.removePriceLine(t);
          }
          F.set(
            e,
            t.map((e) => T.createPriceLine(De(e))),
          );
        }
      }
      function Le(e) {
        for (let e of I.values()) {
          for (let t of e.lines) {
            e.series.removePriceLine(t);
          }
        }
        I.clear();
        for (let t of Object.keys(e)) {
          let n = H.value.indexOf(t);
          let r = D[n]?.[0];
          if (!r) {
            continue;
          }
          let i = Object.values(e[t]).map((e) => r.createPriceLine(De(e)));
          I.set(t, {
            series: r,
            lines: i,
          });
        }
      }
      function Re(e) {
        return Ee(e.filter((e) => A.has(e.time)));
      }
      function ze(e) {
        T?.setMarkers(Re(e));
      }
      function drawEphemeralLine(e, t) {
        Ve();
        if (w) {
          O = w.addLineSeries({
            color: t.color,
            lineWidth: 2,
            lineStyle: r_2.Dashed,
            lastValueVisible: false,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
          });
          O.setData(e);
        }
      }
      function Ve() {
        if (O && w) {
          w.removeSeries(O);
        }
        O = null;
      }
      function panToTime(e) {
        if (!w || !k.length) {
          return;
        }
        let t = 0;
        let n = k.length - 1;
        while (t < n) {
          let r = Math.floor((t + n) / 2);
          if (k[r].time < e) {
            t = r + 1;
          } else {
            n = r;
          }
        }
        let r = Math.max(0, t - 1);
        let i = Math.abs(k[r].time - e) <= Math.abs(k[t].time - e) ? r : t;
        let a = Math.min(Wt, k.length);
        let o = Math.max(0, i - Math.floor(a / 2));
        let s = o + a - 1;
        if (s >= k.length) {
          s = k.length - 1;
          o = Math.max(0, s - a + 1);
        }
        w.timeScale().setVisibleLogicalRange({
          from: o,
          to: s,
        });
      }
      expose({
        reinit: q,
        updateCandle,
        updateLinePoint,
        updateExtraLinePoint,
        setPriceLines: Ie,
        setExtraHorizontalLines: Le,
        setMarkers: ze,
        drawEphemeralLine,
        clearEphemeralLine: Ve,
        panToTime,
        resetView: ct,
        exportImage: lt,
      });
      function Ue() {
        z.value = !z.value;
        $e();
      }
      function We(e) {
        if (L.value.has(e)) {
          L.value.delete(e);
        } else {
          L.value.add(e);
        }
        qe();
        Ye();
      }
      function Ge(e) {
        L.value = new Set(H.value.filter((t) => t !== e));
        qe();
        Ye();
      }
      function Ke() {
        L.value = Te.value ? new Set(H.value) : new Set();
        qe();
        Ye();
      }
      function qe() {
        H.value.forEach((e, t) => {
          if (!L.value.has(e)) {
            Ae(e, t);
          }
        });
        $(M);
      }
      function Je(e) {
        let t = N.get(e);
        if (!t) {
          return;
        }
        let n = xe(R.value, e);
        R.value = n;
        t.series.applyOptions({
          visible: !n.has(e),
        });
        Q(M);
        $e();
      }
      function Ye() {
        et();
        Xe();
        $e();
      }
      function Xe() {
        if (!w) {
          return;
        }
        let e = w.timeScale().getVisibleLogicalRange();
        if (e) {
          E.forEach((t) => t.timeScale().setVisibleLogicalRange(e));
        }
      }
      function Ze() {
        return Gt + m.paneStateKey;
      }
      function Qe() {
        z.value = false;
        L.value = new Set();
        R.value = new Set();
        try {
          let e = localStorage.getItem(Ze());
          if (!e) {
            return;
          }
          let t = Se(e);
          z.value = t.candle;
          L.value = new Set(t.panes);
          R.value = new Set(t.hiddenLines);
        } catch {}
      }
      function $e() {
        try {
          localStorage.setItem(
            Ze(),
            JSON.stringify({
              candle: z.value,
              panes: [...L.value],
              hiddenLines: [...R.value],
            }),
          );
        } catch {}
      }
      function et() {
        if (!w) {
          return;
        }
        let e = H.value.reduce((e, t, n) => {
          if (L.value.has(t)) {
            return e;
          }
          return n;
        }, -1);
        w.timeScale().applyOptions({
          visible: e === -1,
        });
        E.forEach((t, n) => {
          t.timeScale().applyOptions({
            visible: n === e,
          });
        });
      }
      function tt() {
        w.subscribeCrosshairMove((e) => {
          let t = rt(T, e);
          E.forEach((e, n) => {
            let r = D[n][0];
            if (r) {
              it(e, r, t);
            }
          });
          at(e.time ?? null);
        });
        E.forEach((e, t) => {
          e.subscribeCrosshairMove((e) => {
            let n = D[t][0];
            if (!n) {
              return;
            }
            let r = rt(n, e);
            it(w, T, r);
            E.forEach((e, n) => {
              if (n !== t) {
                let t = D[n][0];
                if (t) {
                  it(e, t, r);
                }
              }
            });
            at(e.time ?? null);
          });
        });
      }
      function nt() {
        w.timeScale().subscribeVisibleLogicalRangeChange((e) => {
          E.forEach((t) => {
            t.timeScale().setVisibleLogicalRange(e);
          });
        });
        E.forEach((e) => {
          e.timeScale().subscribeVisibleLogicalRangeChange((e) => {
            w.timeScale().setVisibleLogicalRange(e);
          });
        });
      }
      function rt(e, t) {
        return (t.time && t.seriesData.get(e)) || null;
      }
      function it(e, t, n) {
        let r = he(n);
        if (n && r !== null) {
          e.setCrosshairPosition(r, n.time, t);
          return;
        }
        e.clearCrosshairPosition();
      }
      function at(e) {
        M = e;
        Q(e);
        $(e);
      }
      function X() {
        Q(M);
        $(M);
      }
      function Z(e) {
        return e.toFixed(le);
      }
      function ot(e) {
        if (Math.abs(e) >= 1) {
          return e.toFixed(2);
        }
        return String(Number(e.toPrecision(4)));
      }
      function st(e, t, n = true) {
        let r = t === null ? e.last : e.byTime.get(t);
        return {
          name: e.name,
          color: e.color,
          value: r == null ? `–` : ot(r),
          visible: n,
        };
      }
      function Q(e) {
        let t = (e === null ? undefined : A.get(e)) ?? k[k.length - 1];
        if (!t) {
          B.value = null;
          return;
        }
        B.value = {
          open: Z(t.open),
          high: Z(t.high),
          low: Z(t.low),
          close: Z(t.close),
          volume: ot(t.volume),
          up: t.close >= t.open,
          lines: [...N.values()].map((t) =>
            st(t.indexed, e, !R.value.has(t.indexed.name)),
          ),
        };
      }
      function $(e) {
        let t = {};
        for (let n of H.value) {
          t[n] = [...(P.get(n)?.values() ?? [])].map((t) => st(t.indexed, e));
        }
        Ce.value = t;
      }
      function ct() {
        w?.timeScale().fitContent();
      }
      function lt() {
        if (!w) {
          return;
        }
        let e = [];
        if (!U.value) {
          e.push(w.takeScreenshot());
        }
        H.value.forEach((t, n) => {
          if (!L.value.has(t) && E[n]) {
            e.push(E[n].takeScreenshot());
          }
        });
        if (!e.length) {
          return;
        }
        let t = document.createElement(`canvas`);
        t.width = Math.max(...e.map((e) => e.width));
        t.height = e.reduce((e, t) => e + t.height, 0);
        let n = t.getContext(`2d`);
        if (!n) {
          return;
        }
        n.fillStyle = W.value === `light` ? `#ffffff` : `rgb(29, 25, 23)`;
        n.fillRect(0, 0, t.width, t.height);
        let r = 0;
        for (let t of e) {
          n.drawImage(t, 0, r);
          r += t.height;
        }
        t.toBlob((e) => {
          if (!e) {
            return;
          }
          let t = URL.createObjectURL(e);
          let n = document.createElement(`a`);
          n.href = t;
          n.download = `${m.watermark.replace(/\s*•\s*/g, `-`)}.png`;
          n.click();
          URL.revokeObjectURL(t);
        });
      }
      function ut() {
        if (w !== null) {
          w.remove();
          w = null;
        }
        T = null;
        O = null;
        E.forEach((e) => e.remove());
        E.length = 0;
        D.length = 0;
        k = [];
        A = new Map();
        j = null;
        M = null;
        N.clear();
        P.clear();
        F.clear();
        I.clear();
        B.value = null;
        Ce.value = {};
      }
      function dt(e) {
        if (w === null) {
          return;
        }
        let t = e === `light` ? At.chart : jt.chart;
        w.applyOptions(t);
        E.forEach((e) => e.applyOptions(t));
        ft();
      }
      function ft() {
        for (let [e, t] of Object.entries(m.lines ?? {})) {
          let n = N.get(e);
          if (!n) {
            continue;
          }
          let r = K(t);
          n.series.applyOptions({
            color: r,
          });
          n.series.setData(ve(k, Y(e, t.data)));
          n.indexed.color = r;
        }
        for (let [e, t] of Object.entries(m.extraCharts ?? {})) {
          for (let [n, r] of Object.entries(t)) {
            let t = P.get(e)?.get(n);
            if (!t) {
              continue;
            }
            let i = K(r);
            t.series.applyOptions({
              color: i,
            });
            t.series.setData(ye(k, Y(`${e} / ${n}`, r.data)));
            t.indexed.color = i;
          }
        }
        Ie(`strategy`, Object.values(m.horizontalLines ?? {}));
        Le(m.horizontalExtraLines ?? {});
        X();
      }
      return (t, r) => {
        let i = t_5;
        let a = t_2;
        let d = n;
        mt_1();
        return b_1(`div`, Mt, [
          On(we)
            ? (mt_1(),
              v_1(
                i,
                {
                  key: 0,
                  class: `shrink-0 rounded-none border-0 border-b border-amber-200 dark:border-amber-800`,
                  icon: `i-heroicons-exclamation-triangle`,
                  color: `warning`,
                  variant: `subtle`,
                  title: `Some strategy chart data could not be displayed`,
                  description: On(we),
                },
                null,
                8,
                [`description`],
              ))
            : y_1(``, true),
          On(H).length
            ? (mt_1(),
              b_1(`div`, Nt, [
                __1(
                  `button`,
                  {
                    class: `flex-1 flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 select-none`,
                    onClick: (r[0] ||= (e) => Ue()),
                  },
                  [
                    (mt_1(),
                    b_1(
                      `svg`,
                      {
                        xmlns: `http://www.w3.org/2000/svg`,
                        fill: `none`,
                        viewBox: `0 0 24 24`,
                        "stroke-width": `1.5`,
                        stroke: `currentColor`,
                        class: Qn([`size-3`, On(U) ? `rotate-0` : `rotate-90`]),
                      },
                      [
                        ...(r[4] ||= [
                          __1(
                            `path`,
                            {
                              "stroke-linecap": `round`,
                              "stroke-linejoin": `round`,
                              d: `m8.25 4.5 7.5 7.5-7.5 7.5`,
                            },
                            null,
                            -1,
                          ),
                        ]),
                      ],
                      2,
                    )),
                    __1(`span`, Pt, nr(e.watermark), 1),
                  ],
                ),
                __1(
                  `button`,
                  {
                    class: `shrink-0 px-2 py-1 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`,
                    onClick: (r[1] ||= (e) => Ke()),
                  },
                  nr(On(Te) ? `Collapse all` : `Expand all`),
                  1,
                ),
              ]))
            : y_1(``, true),
          __1(
            `div`,
            {
              class: Qn([
                `relative`,
                On(U) ? `h-0 overflow-hidden` : `flex-[1_1_0%] min-h-[40%]`,
              ]),
            },
            [
              __1(
                `div`,
                {
                  ref_key: `chartContainer`,
                  ref: S,
                  class: `w-full h-full rounded-sm overflow-hidden`,
                },
                null,
                512,
              ),
              On(B) && !On(U)
                ? (mt_1(),
                  b_1(`div`, Ft, [
                    __1(`div`, It, [
                      (mt_1(true),
                      b_1(
                        o_1,
                        null,
                        bt_1(
                          {
                            O: On(B).open,
                            H: On(B).high,
                            L: On(B).low,
                            C: On(B).close,
                            V: On(B).volume,
                          },
                          (e, t) => {
                            mt_1();
                            return b_1(
                              `span`,
                              {
                                key: t,
                                class: `flex gap-1`,
                              },
                              [
                                __1(`span`, Lt, nr(t), 1),
                                __1(
                                  `span`,
                                  {
                                    class: Qn([
                                      On(B).up
                                        ? `text-green-500`
                                        : `text-red-500`,
                                      `font-medium`,
                                    ]),
                                  },
                                  nr(e),
                                  3,
                                ),
                              ],
                            );
                          },
                        ),
                        128,
                      )),
                    ]),
                    (mt_1(true),
                    b_1(
                      o_1,
                      null,
                      bt_1(On(B).lines, (e) => {
                        mt_1();
                        return b_1(
                          `button`,
                          {
                            key: e.name,
                            type: `button`,
                            class: Qn([
                              `flex gap-2 pointer-events-auto cursor-pointer select-none rounded-xs hover:bg-gray-100/80 dark:hover:bg-gray-800/80`,
                              e.visible ? `` : `opacity-50`,
                            ]),
                            "aria-pressed": e.visible,
                            title: e.visible
                              ? `Hide ${e.name}`
                              : `Show ${e.name}`,
                            onClick: Yt_1((t) => Je(e.name), [`stop`]),
                          },
                          [
                            __1(
                              `span`,
                              {
                                style: tr({
                                  color: e.color,
                                }),
                                class: Qn(e.visible ? `` : `line-through`),
                              },
                              nr(e.name),
                              7,
                            ),
                            e.visible
                              ? (mt_1(), b_1(`span`, zt, nr(e.value), 1))
                              : (mt_1(), b_1(`span`, Bt, `hidden`)),
                          ],
                          10,
                          Rt,
                        );
                      }),
                      128,
                    )),
                  ]))
                : y_1(``, true),
              On(U)
                ? y_1(``, true)
                : (mt_1(),
                  b_1(`div`, Vt, [
                    xt_1(t.$slots, `toolbar`),
                    D_1(
                      d,
                      {
                        text: `Reset view`,
                        arrow: ``,
                      },
                      {
                        default: qt_1(() => [
                          D_1(a, {
                            icon: `i-heroicons-viewfinder-circle`,
                            color: `neutral`,
                            variant: `ghost`,
                            size: `xs`,
                            onClick: (r[2] ||= (e) => ct()),
                          }),
                        ]),
                        _: 1,
                      },
                    ),
                    D_1(
                      d,
                      {
                        text: `Save as image`,
                        arrow: ``,
                      },
                      {
                        default: qt_1(() => [
                          D_1(a, {
                            icon: `i-heroicons-camera`,
                            color: `neutral`,
                            variant: `ghost`,
                            size: `xs`,
                            onClick: (r[3] ||= (e) => lt()),
                          }),
                        ]),
                        _: 1,
                      },
                    ),
                  ])),
            ],
            2,
          ),
          (mt_1(true),
          b_1(
            o_1,
            null,
            bt_1(On(H), (e) => {
              mt_1();
              return b_1(
                o_1,
                {
                  key: e,
                },
                [
                  __1(
                    `button`,
                    {
                      class: `w-full shrink-0 flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-t-[1.5px] dark:border-gray-700 select-none`,
                      title: `Double-click to solo this pane`,
                      onClick: (t) => We(e),
                      onDblclick: (t) => Ge(e),
                    },
                    [
                      (mt_1(),
                      b_1(
                        `svg`,
                        {
                          xmlns: `http://www.w3.org/2000/svg`,
                          fill: `none`,
                          viewBox: `0 0 24 24`,
                          "stroke-width": `1.5`,
                          stroke: `currentColor`,
                          class: Qn([
                            `size-3`,
                            On(L).has(e) ? `rotate-0` : `rotate-90`,
                          ]),
                        },
                        [
                          ...(r[5] ||= [
                            __1(
                              `path`,
                              {
                                "stroke-linecap": `round`,
                                "stroke-linejoin": `round`,
                                d: `m8.25 4.5 7.5 7.5-7.5 7.5`,
                              },
                              null,
                              -1,
                            ),
                          ]),
                        ],
                        2,
                      )),
                      __1(`span`, Ut, nr(e), 1),
                      (mt_1(true),
                      b_1(
                        o_1,
                        null,
                        bt_1(On(Ce)[e] ?? [], (e) => {
                          mt_1();
                          return b_1(
                            `span`,
                            {
                              key: e.name,
                              class: `ml-1.5`,
                              style: tr({
                                color: e.color,
                              }),
                            },
                            nr(e.name) + ` ` + nr(e.value),
                            5,
                          );
                        }),
                        128,
                      )),
                    ],
                    40,
                    Ht,
                  ),
                  __1(
                    `div`,
                    {
                      ref_for: true,
                      ref_key: `extraChartsRef`,
                      ref: ae,
                      class: Qn([
                        `relative overflow-hidden`,
                        On(L).has(e)
                          ? `h-0`
                          : On(U)
                            ? `flex-[1_1_150px] min-h-[60px]`
                            : `flex-[0_1_150px] min-h-[60px]`,
                      ]),
                    },
                    null,
                    2,
                  ),
                ],
                64,
              );
            }),
            128,
          )),
        ]);
      };
    },
  }),
  {
    __name: `ChartsInteractiveChart`,
  },
);
const qt = {
  class: `h-full min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-700 dark:bg-gray-900`,
};
const Jt = `#FFA500`;
const Yt = `#10b981`;
const Xt = `#ef4444`;
const Zt = Object.assign(
  t_3(
    k({
      __name: `TradeHistoryChart`,
      props: $_1(
        {
          candles: {},
          trades: {},
          markers: {},
          watermark: {},
          timeframe: {},
          paneStateKey: {},
          lines: {},
          extraCharts: {},
          horizontalLines: {},
          horizontalExtraLines: {},
        },
        {
          modelValue: {
            type: Boolean,
            default: false,
          },
          modelModifiers: {},
        },
      ),
      emits: [`update:modelValue`],
      setup(e) {
        let t = Ft_1(e, `modelValue`);
        let r = e;
        let a = vn();
        let u = g_1(() => Te(r.candles, r.markers));
        let d = g_1(() => new Set(r.candles.map((e) => e.time)));
        function f(e) {
          let t = r.trades.find((t) => t.id === e.tradeId);
          let n = e.orderId ? t?.orders.find((t) => t.id === e.orderId) : null;
          let i = e.orderId
            ? r.markers.find((t) => t.order_id === e.orderId)
            : null;
          let o = n?.executed_at ?? n?.created_at;
          let s = e.time ?? i?.time ?? (o ? Math.floor(o / 1000) : null);
          if (s === null) {
            return;
          }
          let c = g(s);
          if (c) {
            O(`warning`, `${c.title}. ${c.description}`);
          }
          a.value?.panToTime(s);
        }
        function m(e) {
          let t = g(Math.floor(e.opened_at / 1000));
          if (t) {
            return {
              message: `${t.title}. ${t.description}`,
              warning: true,
            };
          }
          return {
            message: `Jump to trade — ${r.timeframe} candle available`,
            warning: false,
          };
        }
        function g(e) {
          if (!r.candles.length) {
            return null;
          }
          let t = we(r.timeframe);
          let n = Math.floor(e / t) * t;
          let time = r.candles[0].time;
          if (n > r.candles.at(-1).time) {
            return {
              title: `Trade is newer than the available candle history`,
              description: `Candles end before this trade occurred. The chart is showing the latest available candle instead.`,
            };
          }
          if (n < time) {
            return {
              title: `Trade is older than the available candle history`,
              description: `Candles begin after this trade occurred. The chart is showing the earliest available candle instead.`,
            };
          }
          if (d.value.has(n)) {
            return null;
          }
          return {
            title: `Candle data is missing for this trade`,
            description: `The ${r.timeframe} candle containing this trade was not recorded. The chart is showing the nearest available candle instead.`,
          };
        }
        function _(e) {
          a.value?.setMarkers(Te(r.candles, De(r.markers, e.orderIds, Jt)));
          y(e.tradeId);
        }
        function v() {
          a.value?.setMarkers(u.value);
          a.value?.clearEphemeralLine();
        }
        function y(e) {
          let t = r.trades.find((t) => t.id === e);
          let n = me(r.candles);
          if (!t || !n || t.closed_at === null) {
            a.value?.clearEphemeralLine();
            return;
          }
          let i = Number(r.candles[0]?.time);
          let o = Number(r.candles.at(-1)?.time);
          let s = Math.floor(t.opened_at / 1000);
          let c = Math.floor(t.closed_at / 1000);
          if (s < i || c > o) {
            a.value?.clearEphemeralLine();
            return;
          }
          a.value?.drawEphemeralLine(
            K(t.opened_at, t.entry_price, t.closed_at, t.exit_price, n),
            {
              color: t.PNL > 0 ? Yt : Xt,
            },
          );
        }
        return (r, i) => {
          mt_1();
          return b_1(
            `div`,
            {
              class: Qn([
                `trade-history-chart w-full h-full min-h-0 flex overflow-hidden rounded-2xl border border-gray-200 bg-gray-100/70 p-2 dark:border-gray-700 dark:bg-gray-950/50`,
                t.value ? `gap-3` : `gap-0`,
              ]),
            },
            [
              D_1(
                Ot,
                {
                  modelValue: t.value,
                  "onUpdate:modelValue": (i[0] ||= (e) => (t.value = e)),
                  items: e.trades,
                  "navigation-details": m,
                  onHighlight: (i[1] ||= (e) => _(e)),
                  onUnhighlight: (i[2] ||= (e) => v()),
                  onZoom: (i[3] ||= (e) => f(e)),
                },
                null,
                8,
                [`modelValue`, `items`],
              ),
              __1(`section`, qt, [
                D_1(
                  Kt,
                  {
                    ref_key: `chart`,
                    ref: a,
                    class: `!border-0`,
                    candles: e.candles,
                    watermark: e.watermark,
                    "pane-state-key": e.paneStateKey,
                    lines: e.lines,
                    "extra-charts": e.extraCharts,
                    "horizontal-lines": e.horizontalLines,
                    "horizontal-extra-lines": e.horizontalExtraLines,
                    markers: On(u),
                    "show-last-price": false,
                  },
                  null,
                  8,
                  [
                    `candles`,
                    `watermark`,
                    `pane-state-key`,
                    `lines`,
                    `extra-charts`,
                    `horizontal-lines`,
                    `horizontal-extra-lines`,
                    `markers`,
                  ],
                ),
              ]),
            ],
            2,
          );
        };
      },
    }),
    [[`__scopeId`, `data-v-d68277e9`]],
  ),
  {
    __name: `ChartsTradeHistoryChart`,
  },
);
export { Ce as d, Kt as n, Zt as t };
