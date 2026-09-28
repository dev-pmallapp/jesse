import {
  B as B_1,
  D as D_1,
  Ht,
  Kt,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt,
  g,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { ot, st } from "./Cd-sGgPF.js";
import { n as n_1, t } from "./2k_QeT3T.js";
import { C, D as D_2, O, S, X as X_1, d, w } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_2 } from "./atteXEGs.js";
import { t as t_3 } from "./6hrdeXKO.js";
import { t as t_4 } from "./OaeI3Ulg.js";
import { t as t_5 } from "./pQUz-uq3.js";
import { t as t_6 } from "./CJNUlr67.js";
import { t as t_7 } from "./BG8CfSEZ2.js";
import { t as t_8 } from "./B4Wc4BFL2.js";
import { t as t_9 } from "./25FdeeAd.js";
import { t as t_10 } from "./D_3yiDAS.js";
import { t as t_11 } from "./BWDSh1SW.js";
import { t as t_12 } from "./DqT4cj-J.js";
const F = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const I = {
  class: `flex flex-col`,
};
const L = {
  class: `text-sm font-medium text-gray-900 dark:text-gray-100`,
};
const R = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const z = {
  class: `flex flex-col`,
};
const B = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const V = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const H = {
  class: `flex justify-center`,
};
const U = {
  key: 1,
  class: `text-sm text-gray-400`,
};
const W = {
  class: `flex justify-center`,
};
const G = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const K = {
  class: `flex items-center justify-end gap-1`,
};
const q = Object.assign(
  k({
    __name: `BacktestSessionsTable`,
    props: {
      sessions: {},
    },
    emits: [`notes`, `load`, `delete`],
    setup(n) {
      let r = n;
      let c = vn([
        {
          id: `created_at`,
          desc: true,
        },
      ]);
      let u = t_6;
      function p(label) {
        return ({ column }) =>
          B_1(t_6, {
            color: `neutral`,
            variant: `ghost`,
            label,
            icon: column.getIsSorted()
              ? column.getIsSorted() === `asc`
                ? `i-heroicons-bars-arrow-up`
                : `i-heroicons-bars-arrow-down`
              : `i-heroicons-arrows-up-down`,
            onClick: () => column.toggleSorting(column.getIsSorted() === `asc`),
          });
      }
      let columns = [
        {
          accessorKey: `strategy`,
          header: `Strategy`,
        },
        {
          id: `session`,
          header: `Session`,
        },
        {
          id: `net_profit`,
          accessorKey: `net_profit_percentage`,
          header: p(`Net Profit %`),
          meta: {
            class: {
              th: `text-center`,
              td: `text-center`,
            },
          },
        },
        {
          accessorKey: `status`,
          header: `Status`,
          meta: {
            class: {
              th: `text-center`,
              td: `text-center`,
            },
          },
        },
        {
          accessorKey: `created_at`,
          header: p(`Date`),
        },
        {
          id: `actions`,
          header: ``,
          meta: {
            class: {
              th: `w-32 text-right`,
              td: `w-32 text-right`,
            },
          },
        },
      ];
      let v = g(() =>
        r.sessions.map((e) => ({
          id: e.id,
          title: e.title,
          strategy: e.state?.form?.routes?.[0]?.strategy,
          exchange: e.state?.form?.exchange,
          symbol: e.state?.form?.routes?.[0]?.symbol,
          timeframe: e.state?.form?.routes?.[0]?.timeframe,
          net_profit_percentage: e.net_profit_percentage,
          status: e.status,
          created_at: e.created_at,
          rawSession: e,
        })),
      );
      function y(e) {
        switch (e?.toLowerCase()) {
          case `running`:
            return `info`;
          case `finished`:
            return `success`;
          case `stopped`:
            return `error`;
          case `cancelled`:
            return `neutral`;
          default:
            return `neutral`;
        }
      }
      return (e, n) => {
        let r = t_8;
        let l = n_1;
        let p = t_11;
        mt();
        return b_1(`div`, F, [
          D_1(
            p,
            {
              sorting: On(c),
              "onUpdate:sorting": (n[0] ||= (e) => {
                if (un(c)) {
                  return (c.value = e);
                }
                return null;
              }),
              data: On(v),
              columns,
              class: `w-full`,
              ui: {
                td: `whitespace-nowrap`,
                th: `whitespace-nowrap`,
              },
            },
            {
              "strategy-cell": qt(({ row }) => [
                __1(`div`, I, [
                  __1(
                    `span`,
                    L,
                    nr(
                      row.original.title ||
                        row.original.strategy ||
                        `Unknown Strategy`,
                    ),
                    1,
                  ),
                  __1(
                    `span`,
                    R,
                    nr(row.original.exchange || `Unknown Exchange`),
                    1,
                  ),
                ]),
              ]),
              "session-cell": qt(({ row }) => [
                __1(`div`, z, [
                  __1(`span`, B, nr(row.original.symbol || `N/A`), 1),
                  __1(`span`, V, nr(row.original.timeframe || `N/A`), 1),
                ]),
              ]),
              "net_profit-cell": qt(({ row }) => [
                __1(`div`, H, [
                  row.original.net_profit_percentage !== null &&
                  row.original.net_profit_percentage !== undefined
                    ? (mt(),
                      b_1(
                        `span`,
                        {
                          key: 0,
                          class: Qn([
                            row.original.net_profit_percentage > 0
                              ? `text-green-600 dark:text-green-400`
                              : `text-red-600 dark:text-red-400`,
                            `text-sm font-semibold`,
                          ]),
                        },
                        nr(row.original.net_profit_percentage.toFixed(2)) +
                          `% `,
                        3,
                      ))
                    : (mt(), b_1(`span`, U, `N/A`)),
                ]),
              ]),
              "status-cell": qt(({ row }) => [
                __1(`div`, W, [
                  D_1(
                    r,
                    {
                      color: y(row.original.status),
                      label: row.original.status,
                      variant: `soft`,
                      size: `xs`,
                    },
                    null,
                    8,
                    [`color`, `label`],
                  ),
                ]),
              ]),
              "created_at-cell": qt(({ row }) => [
                __1(
                  `span`,
                  G,
                  nr(
                    On(w).timestampToReadableDateTime(row.original.created_at),
                  ),
                  1,
                ),
              ]),
              "actions-cell": qt(({ row }) => [
                __1(`div`, K, [
                  D_1(
                    l,
                    {
                      text: `Add Note`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(u),
                          {
                            size: `xs`,
                            variant: `ghost`,
                            color: `neutral`,
                            icon: `i-heroicons-pencil-square`,
                            "aria-label": `Add note`,
                            onClick: (t) =>
                              e.$emit(`notes`, row.original.rawSession),
                          },
                          null,
                          8,
                          [`onClick`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                  D_1(
                    l,
                    {
                      text: `Load Session`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(u),
                          {
                            size: `xs`,
                            variant: `ghost`,
                            color: `neutral`,
                            icon: `i-heroicons-arrow-right`,
                            "aria-label": `Load session`,
                            onClick: (t) => e.$emit(`load`, row.original.id),
                          },
                          null,
                          8,
                          [`onClick`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                  D_1(
                    l,
                    {
                      text: `Delete`,
                    },
                    {
                      default: qt(() => [
                        D_1(
                          On(u),
                          {
                            size: `xs`,
                            variant: `ghost`,
                            color: `error`,
                            icon: `i-heroicons-trash`,
                            "aria-label": `Delete session`,
                            onClick: (t) => e.$emit(`delete`, row.original.id),
                          },
                          null,
                          8,
                          [`onClick`],
                        ),
                      ]),
                      _: 2,
                    },
                    1024,
                  ),
                ]),
              ]),
              _: 1,
            },
            8,
            [`sorting`, `data`],
          ),
        ]);
      };
    },
  }),
  {
    __name: `BacktestSessionsTable`,
  },
);
const se = {
  class: `mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`,
};
const ce = {
  class: `flex items-center gap-3`,
};
const le = {
  class: `flex flex-col gap-3 sm:flex-row sm:items-center`,
};
const ue = {
  key: 0,
  class: `space-y-4`,
};
const de = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const fe = {
  class: `divide-y divide-gray-200 dark:divide-gray-700`,
};
const pe = {
  class: `hidden md:grid md:grid-cols-12 gap-4 items-center`,
};
const me = {
  class: `col-span-3`,
};
const he = {
  class: `col-span-2`,
};
const ge = {
  class: `col-span-2 text-center`,
};
const J = {
  class: `col-span-2 text-center`,
};
const _e = {
  class: `col-span-2`,
};
const ve = {
  class: `col-span-1 flex justify-end gap-2`,
};
const ye = {
  class: `md:hidden space-y-3`,
};
const be = {
  class: `flex items-start justify-between`,
};
const xe = {
  class: `flex-1`,
};
const Se = {
  class: `flex items-center justify-between`,
};
const Ce = {
  class: `flex items-center justify-between`,
};
const we = {
  class: `flex gap-1`,
};
const Te = {
  key: 1,
  class: `space-y-4`,
};
const Ee = {
  key: 0,
  class: `flex justify-center`,
};
const De = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const Oe = {
  class: `p-6`,
};
const ke = {
  class: `mb-6`,
};
const Ae = {
  class: `flex justify-end gap-3`,
};
const Y = 50;
const X = k({
  __name: `history`,
  async setup(e) {
    let a;
    let u;
    r({
      title: `Backtest History - Jesse`,
    });
    let f = ot();
    let x = st();
    let D = d();
    let M = g(() => D.tabs);
    let N = vn([]);
    let F = vn(false);
    let I = vn(null);
    let L = vn(false);
    let R = vn(false);
    let z = vn(true);
    let B = vn(0);
    let V = vn(false);
    let H = vn(null);
    let U = vn(false);
    let W = vn(false);
    let G = vn(30);
    let K = g({
      get: () => f.query.title || ``,
      set: (e) => {
        let t = {
          ...f.query,
        };
        if (e) {
          t.title = e;
        } else {
          delete t.title;
        }
        x.push({
          query: t,
        });
      },
    });
    let X = g({
      get: () => f.query.status || `all`,
      set: (e) => {
        let t = {
          ...f.query,
        };
        if (e === `all`) {
          delete t.status;
        } else {
          t.status = e;
        }
        x.push({
          query: t,
        });
      },
    });
    let Z = g({
      get: () => f.query.dateRange || `all_time`,
      set: (e) => {
        let t = {
          ...f.query,
        };
        if (e === `all_time`) {
          delete t.dateRange;
        } else {
          t.dateRange = e;
        }
        x.push({
          query: t,
        });
      },
    });
    let je = [
      {
        label: `All Statuses`,
        value: `all`,
      },
      {
        label: `Running`,
        value: `running`,
      },
      {
        label: `Finished`,
        value: `finished`,
      },
      {
        label: `Stopped`,
        value: `stopped`,
      },
      {
        label: `Cancelled`,
        value: `cancelled`,
      },
    ];
    let Me = [
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
    let Ne = [
      {
        label: `1 day`,
        value: 1,
      },
      {
        label: `7 days`,
        value: 7,
      },
      {
        label: `30 days`,
        value: 30,
      },
      {
        label: `3 months`,
        value: 90,
      },
      {
        label: `6 months`,
        value: 180,
      },
      {
        label: `1 year`,
        value: 365,
      },
      {
        label: `2 years`,
        value: 730,
      },
      {
        label: `All existing sessions`,
        value: -1,
      },
    ];
    L.value = true;
    [a, u] = Kt(() =>
      C(`/backtest/sessions`, {
        method: `POST`,
        body: {
          limit: Y,
          offset: 0,
          title_search: K.value || null,
          status_filter: X.value === `all` ? null : X.value,
          date_filter: Z.value === `all_time` ? null : Z.value,
        },
        authenticated: true,
      }),
    );
    a = await a;
    u();
    let Q = a;
    if (Q.error.value) {
      D_2(Q.error.value);
    } else {
      N.value = Q.data.value?.sessions ?? [];
      B.value = N.value.length;
      z.value = N.value.length === Y;
    }
    L.value = false;
    let Pe = X_1(() => {
      B.value = 0;
      $();
    }, 300);
    Ht(K, () => {
      Pe();
    });
    Ht(X, () => {
      B.value = 0;
      $();
    });
    Ht(Z, () => {
      B.value = 0;
      $();
    });
    async function $() {
      L.value = true;
      try {
        let e = (
          await S(`/backtest/sessions`, {
            method: `POST`,
            body: {
              limit: Y,
              offset: 0,
              title_search: K.value || null,
              status_filter: X.value === `all` ? null : X.value,
              date_filter: Z.value === `all_time` ? null : Z.value,
            },
            authenticated: true,
          })
        ).data.value;
        N.value = e?.sessions || [];
        B.value = N.value.length;
        z.value = e?.sessions?.length === Y;
      } catch (e) {
        D_2(e);
      } finally {
        L.value = false;
      }
    }
    async function Fe() {
      R.value = true;
      try {
        let e =
          (
            await S(`/backtest/sessions`, {
              method: `POST`,
              body: {
                limit: Y,
                offset: B.value,
                title_search: K.value || null,
                status_filter: X.value === `all` ? null : X.value,
                date_filter: Z.value === `all_time` ? null : Z.value,
              },
              authenticated: true,
            })
          ).data.value?.sessions || [];
        N.value = [...N.value, ...e];
        B.value += e.length;
        z.value = e.length === Y;
      } catch (e) {
        D_2(e);
      } finally {
        R.value = false;
      }
    }
    async function onLoad(e) {
      await D.loadSession(e);
    }
    function onDelete(e) {
      I.value = e;
      F.value = true;
    }
    async function Re() {
      if (I.value) {
        await ze(I.value);
        N.value = N.value.filter((e) => e.id !== I.value);
        --B.value;
      }
      F.value = false;
      I.value = null;
    }
    async function ze(e) {
      if (D.tabs[e]) {
        O(
          `error`,
          `Cannot delete a session that is currently open in a tab. Close the tab first.`,
        );
        return;
      }
      try {
        let t = await S(`/backtest/sessions/${e}/remove`, {
          method: `POST`,
          authenticated: true,
        });
        if (t.error.value) {
          D_2(t.error.value);
          return;
        }
        O(`success`, `Session deleted successfully`);
      } catch (e) {
        D_2(e);
      }
    }
    function onNotes(e) {
      H.value = e;
      V.value = true;
    }
    async function Ve() {
      W.value = true;
      try {
        let e = await S(`/backtest/purge-sessions`, {
          method: `POST`,
          body: {
            days_old: G.value === -1 ? null : G.value,
          },
          authenticated: true,
        });
        if (e.error.value) {
          D_2(e.error.value);
          return;
        }
        let t = e.data.value;
        O(`success`, `Successfully purged ${t.deleted_count} session(s)`);
        U.value = false;
        B.value = 0;
        await $();
      } catch (e) {
        D_2(e);
      } finally {
        W.value = false;
      }
    }
    function He() {
      U.value = false;
      G.value = 30;
    }
    function onSaved(e) {
      if (H.value) {
        let t = N.value.find((e) => e.id === H.value.id);
        if (t) {
          t.title = e.title;
          t.description = e.description;
          H.value.title = e.title;
          H.value.description = e.description;
        }
      }
    }
    return (e, n) => {
      let r = t_3;
      let a = t_6;
      let l = t;
      let u = t_5;
      let _ = t_9;
      let y = q;
      let b = t_2;
      let x = t_10;
      let C = t_7;
      let w = t_4;
      let T = t_12;
      mt();
      return v(T, null, {
        tabs: qt(() => [
          D_1(
            r,
            {
              "current-tab": null,
              tabs: On(M),
              onClose: (n[0] ||= (e) => On(D).closeTab(e, On(f).path)),
              onCancel: On(D).cancel,
            },
            null,
            8,
            [`tabs`, `onCancel`],
          ),
        ]),
        default: qt(() => [
          __1(`div`, se, [
            __1(`div`, ce, [
              (n[9] ||= __1(
                `h1`,
                {
                  class: `text-xl md:text-2xl font-bold text-gray-900 dark:text-white`,
                },
                ` Backtest History `,
                -1,
              )),
              D_1(a, {
                icon: `i-heroicons-trash`,
                color: `error`,
                variant: `soft`,
                size: `sm`,
                label: `Purge`,
                onClick: (n[1] ||= (e) => (U.value = true)),
              }),
            ]),
            __1(`div`, le, [
              D_1(
                l,
                {
                  modelValue: On(K),
                  "onUpdate:modelValue": (n[2] ||= (e) => {
                    if (un(K)) {
                      return (K.value = e);
                    }
                    return null;
                  }),
                  placeholder: `Search by title...`,
                  icon: `i-heroicons-magnifying-glass`,
                  size: `sm`,
                  class: `w-full sm:w-64`,
                },
                null,
                8,
                [`modelValue`],
              ),
              D_1(
                u,
                {
                  modelValue: On(X),
                  "onUpdate:modelValue": (n[3] ||= (e) => {
                    if (un(X)) {
                      return (X.value = e);
                    }
                    return null;
                  }),
                  items: je,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
              D_1(
                u,
                {
                  modelValue: On(Z),
                  "onUpdate:modelValue": (n[4] ||= (e) => {
                    if (un(Z)) {
                      return (Z.value = e);
                    }
                    return null;
                  }),
                  items: Me,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
            ]),
          ]),
          On(L)
            ? (mt(),
              b_1(`div`, ue, [
                __1(`div`, de, [
                  __1(`div`, fe, [
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
                            __1(`div`, pe, [
                              __1(`div`, me, [
                                D_1(_, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(_, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, he, [
                                D_1(_, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(_, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, ge, [
                                D_1(_, {
                                  class: `h-4 w-16 mx-auto`,
                                }),
                              ]),
                              __1(`div`, J, [
                                D_1(_, {
                                  class: `h-6 w-20 mx-auto`,
                                }),
                              ]),
                              __1(`div`, _e, [
                                D_1(_, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, ve, [
                                D_1(_, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(_, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(_, {
                                  class: `h-8 w-8`,
                                }),
                              ]),
                            ]),
                            __1(`div`, ye, [
                              __1(`div`, be, [
                                __1(`div`, xe, [
                                  D_1(_, {
                                    class: `h-4 w-3/4 mb-2`,
                                  }),
                                  D_1(_, {
                                    class: `h-3 w-1/2`,
                                  }),
                                ]),
                                D_1(_, {
                                  class: `h-6 w-16 ml-2`,
                                }),
                              ]),
                              __1(`div`, Se, [
                                D_1(_, {
                                  class: `h-4 w-24`,
                                }),
                                D_1(_, {
                                  class: `h-4 w-16`,
                                }),
                              ]),
                              __1(`div`, Ce, [
                                D_1(_, {
                                  class: `h-3 w-32`,
                                }),
                                __1(`div`, we, [
                                  D_1(_, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(_, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(_, {
                                    class: `h-8 w-8`,
                                  }),
                                ]),
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
            : On(N).length
              ? (mt(),
                b_1(`div`, Te, [
                  D_1(
                    y,
                    {
                      sessions: On(N),
                      onNotes,
                      onLoad,
                      onDelete,
                    },
                    null,
                    8,
                    [`sessions`],
                  ),
                  On(z)
                    ? (mt(),
                      b_1(`div`, Ee, [
                        D_1(
                          a,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(R),
                            onClick: Fe,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : !On(L) && On(N).length === 0
                ? (mt(),
                  b_1(`div`, De, [
                    ...(n[10] ||= [
                      __1(
                        `div`,
                        {
                          class: `text-gray-400 dark:text-gray-500`,
                        },
                        [
                          __1(`i`, {
                            class: `i-heroicons-clock h-12 w-12 mx-auto mb-4`,
                          }),
                          __1(
                            `p`,
                            {
                              class: `text-lg`,
                            },
                            `No backtest history found`,
                          ),
                          __1(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Run a backtest or change filters to see items in backtest your history`,
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
              modelValue: On(F),
              "onUpdate:modelValue": (n[5] ||= (e) => {
                if (un(F)) {
                  return (F.value = e);
                }
                return null;
              }),
              title: `Delete Backtest Session`,
              description: `Are you sure you want to delete this backtest session? This action cannot be undone.`,
              type: `info`,
            },
            {
              default: qt(() => [
                D_1(a, {
                  variant: `solid`,
                  color: `error`,
                  block: ``,
                  class: `sm:w-auto`,
                  label: `Delete`,
                  onClick: Re,
                }),
              ]),
              _: 1,
            },
            8,
            [`modelValue`],
          ),
          On(H)
            ? (mt(),
              v(
                x,
                {
                  key: 3,
                  modelValue: On(V),
                  "onUpdate:modelValue": (n[6] ||= (e) => {
                    if (un(V)) {
                      return (V.value = e);
                    }
                    return null;
                  }),
                  "session-id": On(H).id,
                  "initial-title": On(H).title,
                  "initial-description": On(H).description,
                  onSaved,
                },
                null,
                8,
                [
                  `modelValue`,
                  `session-id`,
                  `initial-title`,
                  `initial-description`,
                ],
              ))
            : y_1(``, true),
          D_1(
            w,
            {
              open: On(U),
              "onUpdate:open": (n[8] ||= (e) => {
                if (un(U)) {
                  return (U.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                __1(`div`, Oe, [
                  (n[13] ||= __1(
                    `h3`,
                    {
                      class: `text-lg font-semibold text-gray-900 dark:text-white mb-4`,
                    },
                    ` Purge Backtest Sessions `,
                    -1,
                  )),
                  __1(`div`, ke, [
                    (n[11] ||= __1(
                      `div`,
                      {
                        class: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4`,
                      },
                      [
                        __1(
                          `div`,
                          {
                            class: `flex items-start gap-3`,
                          },
                          [
                            __1(`i`, {
                              class: `i-heroicons-exclamation-triangle text-red-600 dark:text-red-400 text-xl shrink-0 mt-0.5`,
                            }),
                            __1(
                              `div`,
                              {
                                class: `text-sm text-red-800 dark:text-red-200`,
                              },
                              [
                                __1(
                                  `p`,
                                  {
                                    class: `font-semibold mb-1`,
                                  },
                                  ` Warning: This action is permanent! `,
                                ),
                                __1(
                                  `p`,
                                  null,
                                  `Deleted sessions cannot be recovered. Please select carefully.`,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                      -1,
                    )),
                    D_1(
                      C,
                      {
                        label: `Delete sessions older than:`,
                        class: `mb-4`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            u,
                            {
                              modelValue: On(G),
                              "onUpdate:modelValue": (n[7] ||= (e) => {
                                if (un(G)) {
                                  return (G.value = e);
                                }
                                return null;
                              }),
                              items: Ne,
                              size: `md`,
                            },
                            null,
                            8,
                            [`modelValue`],
                          ),
                        ]),
                        _: 1,
                      },
                    ),
                    (n[12] ||= __1(
                      `p`,
                      {
                        class: `text-sm text-gray-600 dark:text-gray-400`,
                      },
                      ` This will permanently delete all backtest sessions that match your criteria. `,
                      -1,
                    )),
                  ]),
                  __1(`div`, Ae, [
                    D_1(a, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: He,
                    }),
                    D_1(
                      a,
                      {
                        color: `error`,
                        label: `Purge Sessions`,
                        loading: On(W),
                        onClick: Ve,
                      },
                      null,
                      8,
                      [`loading`],
                    ),
                  ]),
                ]),
              ]),
              _: 1,
            },
            8,
            [`open`],
          ),
        ]),
        _: 1,
      });
    };
  },
});
export { X as default };
