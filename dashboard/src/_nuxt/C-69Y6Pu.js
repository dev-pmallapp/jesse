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
  o as o_1,
  qt,
  un,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { ot, st } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import {
  C as C_1,
  D as D_2,
  X as X_1,
  r,
  t as t_2,
  w as w_1,
} from "./B8_r5oP7.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { t as t_3 } from "./BpJ9fpSU.js";
import { t as t_4 } from "./pQUz-uq3.js";
import { t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./B4Wc4BFL2.js";
import { t as t_8 } from "./25FdeeAd.js";
import { t as t_9 } from "./BWDSh1SW.js";
import { t as t_10 } from "./DqT4cj-J.js";
import { t as t_11 } from "./BYsxK_gZ.js";
const he = {
  class: `mb-8`,
};
const ge = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xs`,
};
const _e = {
  class: `space-y-6`,
};
const ve = {
  class: `grid grid-cols-1 lg:grid-cols-12 gap-5`,
};
const ye = {
  class: `lg:col-span-6`,
};
const be = {
  class: `lg:col-span-3`,
};
const xe = {
  class: `lg:col-span-3`,
};
const Se = {
  class: `pt-6 border-t border-gray-100 dark:border-gray-700/50`,
};
const Ce = {
  class: `flex flex-col sm:flex-row gap-5 sm:items-end`,
};
const we = {
  class: `w-full sm:flex-1 grid grid-cols-1 sm:grid-cols-4 gap-5`,
};
const S = {
  class: `flex justify-end pt-2 sm:pt-0`,
};
const C = {
  key: 0,
  class: `space-y-4`,
};
const w = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const T = {
  class: `divide-y divide-gray-200 dark:divide-gray-700`,
};
const E = {
  class: `hidden md:grid md:grid-cols-9 gap-4 items-center`,
};
const D = {
  class: `col-span-1`,
};
const O = {
  class: `col-span-1`,
};
const k = {
  class: `col-span-1`,
};
const Te = {
  class: `col-span-1`,
};
const A = {
  class: `col-span-1`,
};
const Ee = {
  class: `col-span-1`,
};
const De = {
  class: `col-span-1`,
};
const Oe = {
  class: `col-span-1`,
};
const ke = {
  class: `col-span-2`,
};
const Ae = {
  key: 1,
  class: `space-y-4`,
};
const je = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const Me = {
  class: `text-sm font-medium`,
};
const Ne = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Pe = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Fe = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Ie = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const Le = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const Re = {
  key: 0,
  class: `flex justify-center`,
};
const ze = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const j = 50;
const M = k_1({
  __name: `orders-history`,
  async setup(s) {
    let M;
    let N;
    r_2({
      title: `Orders History - Jesse`,
    });
    let P = ot();
    let F = st();
    let I = t_2();
    let L = r();
    let Be = g(() => L.tabs);
    let R = vn([]);
    let z = vn(false);
    let B = vn(false);
    let V = vn(true);
    let H = vn(0);
    let U = vn(false);
    let W = vn(null);
    let G = g({
      get: () => P.query.id || ``,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e) {
          t.id = e;
        } else {
          delete t.id;
        }
        F.push({
          query: t,
        });
      },
    });
    let K = g({
      get: () => P.query.status || `all`,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e === `all`) {
          delete t.status;
        } else {
          t.status = e;
        }
        F.push({
          query: t,
        });
      },
    });
    let q = g({
      get: () => P.query.symbol || ``,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e) {
          t.symbol = e;
        } else {
          delete t.symbol;
        }
        F.push({
          query: t,
        });
      },
    });
    let J = g({
      get: () => P.query.dateRange || `all_time`,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e === `all_time`) {
          delete t.dateRange;
        } else {
          t.dateRange = e;
        }
        F.push({
          query: t,
        });
      },
    });
    let Y = g({
      get: () => P.query.exchange || `all`,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e === `all`) {
          delete t.exchange;
        } else {
          t.exchange = e;
        }
        F.push({
          query: t,
        });
      },
    });
    let X = g({
      get: () => P.query.type || `all`,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e === `all`) {
          delete t.type;
        } else {
          t.type = e;
        }
        F.push({
          query: t,
        });
      },
    });
    let Z = g({
      get: () => P.query.side || `all`,
      set: (e) => {
        let t = {
          ...P.query,
        };
        if (e === `all`) {
          delete t.side;
        } else {
          t.side = e;
        }
        F.push({
          query: t,
        });
      },
    });
    let Ve = [
      {
        label: `All Statuses`,
        value: `all`,
      },
      {
        label: `Active`,
        value: `ACTIVE`,
      },
      {
        label: `Executed`,
        value: `EXECUTED`,
      },
      {
        label: `Canceled`,
        value: `CANCELED`,
      },
      {
        label: `Partially Filled`,
        value: `PARTIALLY_FILLED`,
      },
    ];
    let He = [
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
    let Ue = g(() => {
      let e = [
        {
          label: `All Exchanges`,
          value: `all`,
          disabled: false,
        },
      ];
      for (let t of I.liveTradingExchangeNames) {
        if (I.planLimits.exchanges.includes(t)) {
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
    let We = [
      {
        label: `All Types`,
        value: `all`,
      },
      {
        label: `Market`,
        value: `MARKET`,
      },
      {
        label: `Limit`,
        value: `LIMIT`,
      },
      {
        label: `Stop`,
        value: `STOP`,
      },
      {
        label: `FOK`,
        value: `FOK`,
      },
      {
        label: `Stop Limit`,
        value: `STOP LIMIT`,
      },
    ];
    let Ge = [
      {
        label: `All Sides`,
        value: `all`,
      },
      {
        label: `Buy`,
        value: `buy`,
      },
      {
        label: `Sell`,
        value: `sell`,
      },
    ];
    let columns = [
      {
        accessorKey: `symbol`,
        header: `Symbol`,
      },
      {
        accessorKey: `exchange`,
        header: `Exchange`,
      },
      {
        accessorKey: `side`,
        header: `Side`,
      },
      {
        accessorKey: `type`,
        header: `Type`,
      },
      {
        accessorKey: `price`,
        header: `Price`,
      },
      {
        accessorKey: `qty`,
        header: `QTY`,
      },
      {
        accessorKey: `status`,
        header: `Status`,
      },
      {
        accessorKey: `created_at`,
        header: `Created`,
      },
    ];
    z.value = true;
    [M, N] = Kt(() =>
      C_1(`/orders/live-history`, {
        method: `POST`,
        body: {
          limit: j,
          offset: 0,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
          side_filter: Z.value === `all` ? null : Z.value,
        },
        authenticated: true,
      }),
    );
    M = await M;
    N();
    let Q = M;
    if (Q.error.value) {
      D_2(Q.error.value);
    } else {
      R.value = Q.data.value?.orders ?? [];
      H.value = R.value.length;
      V.value = R.value.length === j;
    }
    z.value = false;
    let qe = X_1(() => {
      H.value = 0;
      $();
    }, 300);
    Ht(G, () => {
      qe();
    });
    Ht([K, q, J, Y, X, Z], () => {
      H.value = 0;
      $();
    });
    async function $() {
      z.value = true;
      try {
        let e = await L.fetchOrdersHistory({
          limit: j,
          offset: 0,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
          side_filter: Z.value === `all` ? null : Z.value,
        });
        R.value = e.orders || [];
        H.value = R.value.length;
        V.value = e.hasMore;
      } catch (e) {
        D_2(e);
      } finally {
        z.value = false;
      }
    }
    async function Je() {
      B.value = true;
      try {
        let e = await L.fetchOrdersHistory({
          limit: j,
          offset: H.value,
          id_search: G.value || null,
          status_filter: K.value === `all` ? null : K.value,
          symbol_filter: q.value || null,
          date_filter: J.value === `all_time` ? null : J.value,
          exchange_filter: Y.value === `all` ? null : Y.value,
          type_filter: X.value === `all` ? null : X.value,
          side_filter: Z.value === `all` ? null : Z.value,
        });
        R.value = [...R.value, ...(e.orders || [])];
        H.value += (e.orders || []).length;
        V.value = e.hasMore;
      } catch (e) {
        D_2(e);
      } finally {
        B.value = false;
      }
    }
    function onSelect(e, t) {
      W.value = t.original.id;
      U.value = true;
    }
    function Xe() {
      G.value = ``;
      K.value = `all`;
      q.value = ``;
      J.value = `all_time`;
      Y.value = `all`;
      X.value = `all`;
      Z.value = `all`;
    }
    function Ze(e) {
      switch (e?.toLowerCase()) {
        case `active`:
          return `warning`;
        case `executed`:
          return `success`;
        case `canceled`:
          return `error`;
        case `partially_filled`:
          return `info`;
        default:
          return `neutral`;
      }
    }
    return (t, n) => {
      let o = t_3;
      let s = t_1;
      let f = t_6;
      let m = t_4;
      let h = t_5;
      let g = t_8;
      let _ = t_7;
      let v = t_9;
      let y = t_11;
      let b = t_10;
      mt();
      return v_1(b, null, {
        tabs: qt(() => [
          D_1(
            o,
            {
              "current-tab": null,
              tabs: On(Be),
              onClose: On(L).closeTab,
              onCancel: On(L).cancel,
            },
            null,
            8,
            [`tabs`, `onClose`, `onCancel`],
          ),
        ]),
        default: qt(() => [
          __1(`div`, he, [
            (n[8] ||= __1(
              `h1`,
              {
                class: `text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6`,
              },
              ` Orders History `,
              -1,
            )),
            __1(`div`, ge, [
              __1(`div`, _e, [
                __1(`div`, ve, [
                  __1(`div`, ye, [
                    D_1(
                      f,
                      {
                        label: `Search Session`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            s,
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
                  __1(`div`, be, [
                    D_1(
                      f,
                      {
                        label: `Status`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            m,
                            {
                              modelValue: On(K),
                              "onUpdate:modelValue": (n[1] ||= (e) => {
                                if (un(K)) {
                                  return (K.value = e);
                                }
                                return null;
                              }),
                              items: Ve,
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
                  __1(`div`, xe, [
                    D_1(
                      f,
                      {
                        label: `Timeframe`,
                        size: `md`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            m,
                            {
                              modelValue: On(J),
                              "onUpdate:modelValue": (n[2] ||= (e) => {
                                if (un(J)) {
                                  return (J.value = e);
                                }
                                return null;
                              }),
                              items: He,
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
                __1(`div`, Se, [
                  __1(`div`, Ce, [
                    __1(`div`, we, [
                      D_1(
                        f,
                        {
                          label: `Symbol`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              s,
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
                        f,
                        {
                          label: `Exchange`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              m,
                              {
                                modelValue: On(Y),
                                "onUpdate:modelValue": (n[4] ||= (e) => {
                                  if (un(Y)) {
                                    return (Y.value = e);
                                  }
                                  return null;
                                }),
                                items: On(Ue),
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
                        f,
                        {
                          label: `Order Type`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              m,
                              {
                                modelValue: On(X),
                                "onUpdate:modelValue": (n[5] ||= (e) => {
                                  if (un(X)) {
                                    return (X.value = e);
                                  }
                                  return null;
                                }),
                                items: We,
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
                        f,
                        {
                          label: `Side`,
                          size: `sm`,
                        },
                        {
                          default: qt(() => [
                            D_1(
                              m,
                              {
                                modelValue: On(Z),
                                "onUpdate:modelValue": (n[6] ||= (e) => {
                                  if (un(Z)) {
                                    return (Z.value = e);
                                  }
                                  return null;
                                }),
                                items: Ge,
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
                    __1(`div`, S, [
                      D_1(h, {
                        label: `Reset All`,
                        color: `neutral`,
                        variant: `soft`,
                        icon: `i-heroicons-arrow-path`,
                        size: `sm`,
                        class: `w-full sm:w-auto justify-center`,
                        onClick: Xe,
                      }),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ]),
          On(z)
            ? (mt(),
              b_1(`div`, C, [
                __1(`div`, w, [
                  __1(`div`, T, [
                    (mt(),
                    b_1(
                      o_1,
                      null,
                      bt(5, (key) =>
                        __1(
                          `div`,
                          {
                            key,
                            class: `p-4`,
                          },
                          [
                            __1(`div`, E, [
                              __1(`div`, D, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, O, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, k, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Te, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, A, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Ee, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, De, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, Oe, [
                                D_1(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, ke, [
                                D_1(g, {
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
            : On(R).length
              ? (mt(),
                b_1(`div`, Ae, [
                  __1(`div`, je, [
                    D_1(
                      v,
                      {
                        data: On(R),
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
                          __1(`span`, Me, nr(row.original.symbol), 1),
                        ]),
                        "exchange-cell": qt(({ row }) => [
                          __1(`span`, Ne, nr(row.original.exchange), 1),
                        ]),
                        "side-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            {
                              class: Qn([
                                `text-sm font-medium`,
                                row.original.side === `buy`
                                  ? `text-green-600 dark:text-green-400`
                                  : `text-red-600 dark:text-red-400`,
                              ]),
                            },
                            nr(row.original.side),
                            3,
                          ),
                        ]),
                        "type-cell": qt(({ row }) => [
                          __1(`span`, Pe, nr(row.original.type), 1),
                        ]),
                        "price-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            Fe,
                            nr(
                              row.original.price
                                ? On(w_1).roundPrice(row.original.price)
                                : `-`,
                            ),
                            1,
                          ),
                        ]),
                        "qty-cell": qt(({ row }) => [
                          __1(`span`, Ie, nr(row.original.qty), 1),
                        ]),
                        "status-cell": qt(({ row }) => [
                          D_1(
                            _,
                            {
                              color: Ze(row.original.status),
                              label: row.original.status,
                              variant: `soft`,
                              size: `xs`,
                            },
                            null,
                            8,
                            [`color`, `label`],
                          ),
                        ]),
                        "created_at-cell": qt(({ row }) => [
                          __1(
                            `span`,
                            Le,
                            nr(
                              On(w_1).timestampToReadableDateTime(
                                row.original.created_at,
                              ),
                            ),
                            1,
                          ),
                        ]),
                        _: 1,
                      },
                      8,
                      [`data`],
                    ),
                  ]),
                  On(V)
                    ? (mt(),
                      b_1(`div`, Re, [
                        D_1(
                          h,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(B),
                            onClick: Je,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : !On(z) && On(R).length === 0
                ? (mt(),
                  b_1(`div`, ze, [
                    ...(n[9] ||= [
                      __1(
                        `div`,
                        {
                          class: `text-gray-400 dark:text-gray-500`,
                        },
                        [
                          __1(`i`, {
                            class: `i-heroicons-rectangle-stack h-12 w-12 mx-auto mb-4`,
                          }),
                          __1(
                            `p`,
                            {
                              class: `text-lg`,
                            },
                            `No orders found`,
                          ),
                          __1(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Adjust your filters to see items in your order history`,
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]))
                : y_1(``, true),
          D_1(
            y,
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
export { M as default };
