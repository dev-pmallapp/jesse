import {
  D as D_1,
  Ht,
  Kt,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt,
  g,
  k as k_1,
  mt,
  nr,
  o,
  qt,
  un,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { ot, st } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { C, D as D_2, X as X_1, r, t as t_2, w as w_1 } from "./B8_r5oP7.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { t as t_3 } from "./BpJ9fpSU.js";
import { t as t_4 } from "./pQUz-uq3.js";
import { t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./B4Wc4BFL2.js";
import { t as t_8 } from "./25FdeeAd.js";
import { t as t_9 } from "./BWDSh1SW.js";
import { t as t_10 } from "./DqT4cj-J.js";
import { t as t_11 } from "./Bw1-c76v.js";
import { t as t_12 } from "./BYsxK_gZ.js";
const me = {
  class: `mb-8`,
};
const he = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs`,
};
const ge = {
  class: `space-y-6`,
};
const _e = {
  class: `grid grid-cols-1 lg:grid-cols-12 gap-5`,
};
const ve = {
  class: `lg:col-span-6`,
};
const ye = {
  class: `lg:col-span-3`,
};
const be = {
  class: `lg:col-span-3`,
};
const xe = {
  class: `pt-6 border-t border-gray-100 dark:border-gray-700/50`,
};
const Se = {
  class: `flex flex-col sm:flex-row gap-5 sm:items-end`,
};
const Ce = {
  class: `w-full sm:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5`,
};
const we = {
  class: `flex justify-end pt-2 sm:pt-0`,
};
const Te = {
  key: 0,
  class: `space-y-4`,
};
const Ee = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const w = {
  class: `divide-y divide-gray-200 dark:divide-gray-700`,
};
const T = {
  class: `hidden md:grid md:grid-cols-9 gap-4 items-center`,
};
const E = {
  class: `col-span-1`,
};
const D = {
  class: `col-span-1`,
};
const De = {
  class: `col-span-1`,
};
const Oe = {
  class: `col-span-1`,
};
const ke = {
  class: `col-span-1`,
};
const Ae = {
  class: `col-span-1`,
};
const je = {
  class: `col-span-1`,
};
const Me = {
  class: `col-span-1`,
};
const Ne = {
  class: `col-span-1`,
};
const Pe = {
  key: 1,
  class: `space-y-4`,
};
const Fe = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const Ie = {
  class: `text-sm font-medium`,
};
const Le = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Re = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const ze = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Be = {
  key: 0,
  class: `flex flex-col`,
};
const Ve = {
  key: 1,
  class: `text-gray-400`,
};
const He = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const Ue = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const We = {
  key: 0,
  class: `flex justify-center`,
};
const O = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const k = 50;
const A = k_1({
  __name: `trades-history`,
  async setup(c) {
    let A;
    let j;
    r_2({
      title: `Trades History - Jesse`,
    });
    let M = ot();
    let N = st();
    let P = t_2();
    let F = r();
    let Ge = g(() => F.tabs);
    let I = vn([]);
    let L = vn(false);
    let R = vn(false);
    let z = vn(true);
    let B = vn(0);
    let V = vn(false);
    let H = vn(null);
    let U = vn(false);
    let W = vn(null);
    let G = g({
      get: () => M.query.id || ``,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e) {
          t.id = e;
        } else {
          delete t.id;
        }
        N.push({
          query: t,
        });
      },
    });
    let K = g({
      get: () => M.query.status || `all`,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e === `all`) {
          delete t.status;
        } else {
          t.status = e;
        }
        N.push({
          query: t,
        });
      },
    });
    let q = g({
      get: () => M.query.symbol || ``,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e) {
          t.symbol = e;
        } else {
          delete t.symbol;
        }
        N.push({
          query: t,
        });
      },
    });
    let J = g({
      get: () => M.query.dateRange || `all_time`,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e === `all_time`) {
          delete t.dateRange;
        } else {
          t.dateRange = e;
        }
        N.push({
          query: t,
        });
      },
    });
    let Y = g({
      get: () => M.query.exchange || `all`,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e === `all`) {
          delete t.exchange;
        } else {
          t.exchange = e;
        }
        N.push({
          query: t,
        });
      },
    });
    let X = g({
      get: () => M.query.type || `all`,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e === `all`) {
          delete t.type;
        } else {
          t.type = e;
        }
        N.push({
          query: t,
        });
      },
    });
    let Ke = [
      {
        label: `All Statuses`,
        value: `all`,
      },
      {
        label: `Open`,
        value: `open`,
      },
      {
        label: `Closed`,
        value: `closed`,
      },
    ];
    let qe = [
      {
        label: `All Time`,
        value: `all_time`,
      },
      {
        label: `Last 7 Days`,
        value: `7_days`,
      },
      {
        label: `Last 30 Days`,
        value: `30_days`,
      },
      {
        label: `Last 90 Days`,
        value: `90_days`,
      },
    ];
    let Je = g(() => {
      let e = [
        {
          label: `All Exchanges`,
          value: `all`,
          disabled: false,
        },
      ];
      for (let t of P.liveTradingExchangeNames) {
        if (P.planLimits.exchanges.includes(t)) {
          e.push({
            label: t,
            value: t,
            disabled: false,
          });
        } else {
          e.push({
            label: `${t} (Upgrade required)`,
            value: t,
            disabled: true,
          });
        }
      }
      return e;
    });
    let Ye = [
      {
        label: `All Types`,
        value: `all`,
      },
      {
        label: `Long`,
        value: `long`,
      },
      {
        label: `Short`,
        value: `short`,
      },
    ];
    let columns = [
      {
        accessorKey: `symbol`,
        header: `Symbol`,
      },
      {
        accessorKey: `type`,
        header: `Type`,
      },
      {
        accessorKey: `entry_price`,
        header: `Entry`,
      },
      {
        accessorKey: `exit_price`,
        header: `Exit`,
      },
      {
        accessorKey: `qty`,
        header: `QTY`,
      },
      {
        accessorKey: `pnl`,
        header: `PNL`,
      },
      {
        accessorKey: `opened_at`,
        header: `Opened`,
      },
      {
        accessorKey: `status`,
        header: `Status`,
      },
      {
        accessorKey: `exchange`,
        header: `Exchange`,
      },
    ];
    L.value = true;
    [A, j] = Kt(() =>
      C(`/closed-trades/live-history`, {
        method: `POST`,
        body: {
          limit: k,
          offset: 0,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
        },
        authenticated: true,
      }),
    );
    A = await A;
    j();
    let Z = A;
    if (Z.error.value) {
      D_2(Z.error.value);
    } else {
      I.value = Z.data.value?.trades ?? [];
      B.value = I.value.length;
      z.value = I.value.length === k;
    }
    L.value = false;
    let Ze = X_1(() => {
      B.value = 0;
      Q();
    }, 300);
    Ht(G, () => {
      Ze();
    });
    Ht([K, q, J, Y, X], () => {
      B.value = 0;
      Q();
    });
    async function Q() {
      L.value = true;
      try {
        let e = await F.fetchTradesHistory({
          limit: k,
          offset: 0,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
        });
        I.value = e.trades || [];
        B.value = I.value.length;
        z.value = e.hasMore;
      } catch (e) {
        D_2(e);
      } finally {
        L.value = false;
      }
    }
    async function Qe() {
      R.value = true;
      try {
        let e = await F.fetchTradesHistory({
          limit: k,
          offset: B.value,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
        });
        I.value = [...I.value, ...(e.trades || [])];
        B.value += (e.trades || []).length;
        z.value = e.hasMore;
      } catch (e) {
        D_2(e);
      } finally {
        R.value = false;
      }
    }
    function onSelect(e, t) {
      H.value = t.original.id;
      V.value = true;
    }
    function onOrderClick(e) {
      W.value = e;
      U.value = true;
    }
    function tt() {
      G.value = ``;
      K.value = `all`;
      q.value = ``;
      J.value = `all_time`;
      Y.value = `all`;
      X.value = `all`;
    }
    function $(e) {
      let t = Number(e);
      if (t === 0 || isNaN(t)) {
        return `text-gray-900 dark:text-gray-100`;
      }
      if (t > 0) {
        return `text-green-600 dark:text-green-400`;
      }
      return `text-red-600 dark:text-red-400`;
    }
    return (t, n) => {
      let s = t_3;
      let c = t_1;
      let p = t_6;
      let h = t_4;
      let g = t_5;
      let _ = t_8;
      let v = t_7;
      let y = t_9;
      let b = t_11;
      let x = t_12;
      let C = t_10;
      mt();
      return v_1(C, null, {
        tabs: qt(() => [
          D_1(
            s,
            {
              "current-tab": null,
              tabs: On(Ge),
              onClose: On(F).closeTab,
              onCancel: On(F).cancel,
            },
            null,
            8,
            [`tabs`, `onClose`, `onCancel`],
          ),
        ]),
        default: qt(() => [
          __1(`div`, me, [
            (n[8] ||= __1(
              `h1`,
              {
                class: `text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6`,
              },
              ` Trades History `,
              -1,
            )),
            __1(`div`, he, [
              __1(`div`, ge, [
                __1(`div`, _e, [
                  __1(`div`, ve, [
                    D_1(
                      p,
                      {
                        label: `Search Session`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            c,
                            {
                              modelValue: On(G),
                              "onUpdate:modelValue": (n[0] ||= (e) => {
                                if (un(G)) {
                                  return (G.value = e);
                                }
                                return null;
                              }),
                              placeholder: `Enter Session ID...`,
                              icon: `i-heroicons-magnifying-glass`,
                              variant: `outline`,
                            },
                            null,
                            8,
                            [`modelValue`],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  __1(`div`, ye, [
                    D_1(
                      p,
                      {
                        label: `Status`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            h,
                            {
                              modelValue: On(K),
                              "onUpdate:modelValue": (n[1] ||= (e) => {
                                if (un(K)) {
                                  return (K.value = e);
                                }
                                return null;
                              }),
                              items: Ke,
                            },
                            null,
                            8,
                            [`modelValue`],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                  __1(`div`, be, [
                    D_1(
                      p,
                      {
                        label: `Timeframe`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            h,
                            {
                              modelValue: On(J),
                              "onUpdate:modelValue": (n[2] ||= (e) => {
                                if (un(J)) {
                                  return (J.value = e);
                                }
                                return null;
                              }),
                              items: qe,
                            },
                            null,
                            8,
                            [`modelValue`],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                  ]),
                ]),
                __1(`div`, xe, [
                  __1(`div`, Se, [
                    __1(`div`, Ce, [
                      D_1(
                        p,
                        {
                          label: `Symbol`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              c,
                              {
                                modelValue: On(q),
                                "onUpdate:modelValue": (n[3] ||= (e) => {
                                  if (un(q)) {
                                    return (q.value = e);
                                  }
                                  return null;
                                }),
                                placeholder: `BTC-USDT...`,
                                icon: `i-heroicons-currency-dollar`,
                              },
                              null,
                              8,
                              [`modelValue`],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                      D_1(
                        p,
                        {
                          label: `Exchange`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              h,
                              {
                                modelValue: On(Y),
                                "onUpdate:modelValue": (n[4] ||= (e) => {
                                  if (un(Y)) {
                                    return (Y.value = e);
                                  }
                                  return null;
                                }),
                                items: On(Je),
                              },
                              null,
                              8,
                              [`modelValue`, `items`],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                      D_1(
                        p,
                        {
                          label: `Type`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              h,
                              {
                                modelValue: On(X),
                                "onUpdate:modelValue": (n[5] ||= (e) => {
                                  if (un(X)) {
                                    return (X.value = e);
                                  }
                                  return null;
                                }),
                                items: Ye,
                              },
                              null,
                              8,
                              [`modelValue`],
                            ),
                          ]),
                          _: 1,
                        },
                      ),
                    ]),
                    __1(`div`, we, [
                      D_1(g, {
                        label: `Reset All`,
                        color: `neutral`,
                        variant: `soft`,
                        icon: `i-heroicons-arrow-path`,
                        size: `sm`,
                        class: `w-full sm:w-auto justify-center`,
                        onClick: tt,
                      }),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
          On(L)
            ? (mt(),
              b_1(`div`, Te, [
                __1(`div`, Ee, [
                  __1(`div`, w, [
                    (mt(),
                    b_1(
                      o,
                      null,
                      bt(5, (key) =>
                        __1(
                          `div`,
                          {
                            key,
                            class: `p-4`,
                          },
                          [
                            __1(`div`, T, [
                              __1(`div`, E, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, D, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, De, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Oe, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, ke, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Ae, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, je, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Me, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Ne, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                            ]),
                          ],
                        ),
                      ),
                      64,
                    )),
                  ]),
                ]),
              ]))
            : On(I).length
              ? (mt(),
                b_1(`div`, Pe, [
                  __1(`div`, Fe, [
                    D_1(
                      y,
                      {
                        data: On(I),
                        columns,
                        class: `w-full`,
                        ui: {
                          td: `whitespace-nowrap`,
                          th: `whitespace-nowrap`,
                        },
                        onSelect,
                      },
                      {
                        "symbol-cell": qt(({ row }) => [
                          __1(`span`, Ie, nr(row.original.symbol), 1),
                        ]),
                        "type-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            {
                              class: Qn([
                                `text-sm font-medium`,
                                row.original.type === `long`
                                  ? `text-green-600 dark:text-green-400`
                                  : `text-red-600 dark:text-red-400`,
                              ]),
                            },
                            nr(row.original.type),
                            3,
                          ),
                        ]),
                        "entry_price-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            Le,
                            nr(On(w_1).roundPrice(row.original.entry_price)),
                            1,
                          ),
                        ]),
                        "exit_price-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            Re,
                            nr(
                              row.original.exit_price
                                ? On(w_1).roundPrice(row.original.exit_price)
                                : `-`,
                            ),
                            1,
                          ),
                        ]),
                        "qty-cell": qt(({ row }) => [
                          __1(`span`, ze, nr(row.original.qty), 1),
                        ]),
                        "pnl-cell": qt(({ row }) => [
                          row.original.pnl !== null &&
                          row.original.pnl !== undefined
                            ? (mt(),
                              b_1(`div`, Be, [
                                __1(
                                  `span`,
                                  {
                                    class: Qn([
                                      `text-sm font-bold`,
                                      $(row.original.pnl),
                                    ]),
                                  },
                                  nr(Math.round(row.original.pnl * 100) / 100),
                                  3,
                                ),
                                __1(
                                  `span`,
                                  {
                                    class: Qn([`text-xs`, $(row.original.pnl)]),
                                  },
                                  ` (` +
                                    nr(
                                      Math.round(
                                        row.original.pnl_percentage * 100,
                                      ) / 100,
                                    ) +
                                    `%) `,
                                  3,
                                ),
                              ]))
                            : (mt(), b_1(`span`, Ve, `-`)),
                        ]),
                        "opened_at-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            He,
                            nr(
                              On(w_1).timestampToReadableDateTime(
                                row.original.opened_at,
                              ),
                            ),
                            1,
                          ),
                        ]),
                        "status-cell": qt(({ row }) => [
                          D_1(
                            v,
                            {
                              color:
                                row.original.status === `open`
                                  ? `info`
                                  : `neutral`,
                              label: row.original.status,
                              variant: `soft`,
                              size: `xs`,
                            },
                            null,
                            8,
                            [`color`, `label`],
                          ),
                        ]),
                        "exchange-cell": qt(({ row }) => [
                          __1(`span`, Ue, nr(row.original.exchange), 1),
                        ]),
                        _: 1,
                      },
                      8,
                      [`data`],
                    ),
                  ]),
                  On(z)
                    ? (mt(),
                      b_1(`div`, We, [
                        D_1(
                          g,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(R),
                            onClick: Qe,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : !On(L) && On(I).length === 0
                ? (mt(),
                  b_1(`div`, O, [
                    ...(n[9] ||= [
                      __1(
                        `div`,
                        {
                          class: `text-gray-400 dark:text-gray-500`,
                        },
                        [
                          __1(`i`, {
                            class: `i-heroicons-chart-bar h-12 w-12 mx-auto mb-4`,
                          }),
                          __1(
                            `p`,
                            {
                              class: `text-lg`,
                            },
                            `No trades found`,
                          ),
                          __1(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Adjust your filters to see items in your trade history`,
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]))
                : y_1(``, true),
          D_1(
            b,
            {
              modelValue: On(V),
              "onUpdate:modelValue": (n[6] ||= (e) => {
                if (un(V)) {
                  return (V.value = e);
                }
                return null;
              }),
              "trade-id": On(H),
              onOrderClick,
            },
            null,
            8,
            [`modelValue`, `trade-id`],
          ),
          D_1(
            x,
            {
              modelValue: On(U),
              "onUpdate:modelValue": (n[7] ||= (e) => {
                if (un(U)) {
                  return (U.value = e);
                }
                return null;
              }),
              "order-id": On(W),
            },
            null,
            8,
            [`modelValue`, `order-id`],
          ),
        ]),
        _: 1,
      });
    };
  },
});
export { A as default };
