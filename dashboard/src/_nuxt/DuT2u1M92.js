import {
  B as B_1,
  D,
  Ht,
  Kt,
  On,
  _,
  b as b_1,
  bt,
  g,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { it, ot, st } from "./Cd-sGgPF.js";
import { n as n_1, t } from "./2k_QeT3T.js";
import { C, D as D_2, O, S, X as X_1, n as n_2, w } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_2 } from "./atteXEGs.js";
import { t as t_3 } from "./OaeI3Ulg.js";
import { t as t_4 } from "./pQUz-uq3.js";
import { t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./B4Wc4BFL2.js";
import { t as t_8 } from "./25FdeeAd.js";
import { t as t_9 } from "./BWDSh1SW.js";
import { t as t_10 } from "./DqT4cj-J.js";
import { t as t_11 } from "./DP8dx3Mz.js";
const N = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const P = {
  class: `flex flex-col`,
};
const F = {
  class: `text-sm font-medium text-gray-900 dark:text-white`,
};
const I = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const L = {
  class: `flex flex-col`,
};
const R = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const z = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const B = {
  class: `flex justify-center gap-1 text-lg`,
};
const V = {
  key: 0,
};
const H = {
  key: 1,
};
const U = {
  key: 2,
  class: `text-gray-400 text-sm`,
};
const W = {
  class: `flex justify-center`,
};
const G = {
  class: `text-sm`,
};
const K = {
  class: `flex justify-center`,
};
const q = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const J = {
  class: `flex items-center justify-end gap-1`,
};
const ce = Object.assign(
  k({
    __name: `MonteCarloSessionsTable`,
    props: {
      sessions: {},
    },
    emits: [`notes`, `load`, `delete`],
    setup(n) {
      let r = t_5;
      let s = n;
      let l = vn([
        {
          id: `created_at`,
          desc: true,
        },
      ]);
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
          id: `simulation_types`,
          header: `Types`,
          meta: {
            class: {
              th: `text-center`,
              td: `text-center`,
            },
          },
        },
        {
          accessorKey: `num_scenarios`,
          header: `Scenarios`,
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
          header: ({ column }) =>
            B_1(t_5, {
              color: `neutral`,
              variant: `ghost`,
              label: `Date`,
              icon: column.getIsSorted()
                ? column.getIsSorted() === `asc`
                  ? `i-heroicons-bars-arrow-up`
                  : `i-heroicons-bars-arrow-down`
                : `i-heroicons-arrows-up-down`,
              onClick: () =>
                column.toggleSorting(column.getIsSorted() === `asc`),
            }),
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
      let h = g(() =>
        s.sessions.map((e) => ({
          id: e.id,
          title: e.title,
          strategy: e.state?.form?.routes?.[0]?.strategy,
          exchange: e.state?.form?.exchange,
          symbol: e.state?.form?.routes?.[0]?.symbol,
          timeframe: e.state?.form?.routes?.[0]?.timeframe,
          has_trades: e.has_trades,
          has_candles: e.has_candles,
          num_scenarios: e.state?.form?.num_scenarios,
          status: e.status,
          created_at: e.created_at,
          rawSession: e,
        })),
      );
      function v(e) {
        switch (e?.toLowerCase()) {
          case `running`:
            return `info`;
          case `finished`:
            return `success`;
          case `stopped`:
            return `error`;
          case `terminated`:
            return `warning`;
          default:
            return `neutral`;
        }
      }
      return (e, n) => {
        let s = t_7;
        let c = n_1;
        let g = t_9;
        mt();
        return b_1(`div`, N, [
          D(
            g,
            {
              sorting: On(l),
              "onUpdate:sorting": (n[0] ||= (e) => {
                if (un(l)) {
                  return (l.value = e);
                }
                return null;
              }),
              data: On(h),
              columns,
              class: `w-full`,
              ui: {
                td: `whitespace-nowrap`,
                th: `whitespace-nowrap`,
              },
            },
            {
              "strategy-cell": qt(({ row }) => [
                _(`div`, P, [
                  _(
                    `span`,
                    F,
                    nr(
                      row.original.title ||
                        row.original.strategy ||
                        `Unknown Strategy`,
                    ),
                    1,
                  ),
                  _(
                    `span`,
                    I,
                    nr(row.original.exchange || `Unknown Exchange`),
                    1,
                  ),
                ]),
              ]),
              "session-cell": qt(({ row }) => [
                _(`div`, L, [
                  _(`span`, R, nr(row.original.symbol || `N/A`), 1),
                  _(`span`, z, nr(row.original.timeframe || `N/A`), 1),
                ]),
              ]),
              "simulation_types-cell": qt(({ row }) => [
                _(`div`, B, [
                  row.original.has_trades
                    ? (mt(), b_1(`span`, V, `🔀`))
                    : y_1(``, true),
                  row.original.has_candles
                    ? (mt(), b_1(`span`, H, `📈`))
                    : y_1(``, true),
                  !row.original.has_trades && !row.original.has_candles
                    ? (mt(), b_1(`span`, U, `-`))
                    : y_1(``, true),
                ]),
              ]),
              "num_scenarios-cell": qt(({ row }) => [
                _(`div`, W, [_(`span`, G, nr(row.original.num_scenarios), 1)]),
              ]),
              "status-cell": qt(({ row }) => [
                _(`div`, K, [
                  D(
                    s,
                    {
                      color: v(row.original.status),
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
                _(
                  `span`,
                  q,
                  nr(
                    On(w).timestampToReadableDateTime(row.original.created_at),
                  ),
                  1,
                ),
              ]),
              "actions-cell": qt(({ row }) => [
                _(`div`, J, [
                  D(
                    c,
                    {
                      text: `Add Note`,
                    },
                    {
                      default: qt(() => [
                        D(
                          On(r),
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
                  D(
                    c,
                    {
                      text: `Load Session`,
                    },
                    {
                      default: qt(() => [
                        D(
                          On(r),
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
                  D(
                    c,
                    {
                      text: `Delete`,
                    },
                    {
                      default: qt(() => [
                        D(
                          On(r),
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
    __name: `MonteCarloSessionsTable`,
  },
);
const le = {
  class: `mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`,
};
const ue = {
  class: `flex items-center gap-3`,
};
const de = {
  class: `flex flex-col gap-3 sm:flex-row sm:items-center`,
};
const fe = {
  key: 0,
  class: `space-y-4`,
};
const pe = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const me = {
  class: `divide-y divide-gray-200 dark:divide-gray-700`,
};
const he = {
  class: `hidden md:grid md:grid-cols-12 gap-4 items-center`,
};
const ge = {
  class: `col-span-3`,
};
const _e = {
  class: `col-span-2`,
};
const ve = {
  class: `col-span-2 text-center`,
};
const ye = {
  class: `col-span-2 text-center`,
};
const be = {
  class: `col-span-2`,
};
const xe = {
  class: `col-span-1 flex justify-end gap-2`,
};
const Se = {
  class: `md:hidden space-y-3`,
};
const Ce = {
  class: `flex items-start justify-between`,
};
const we = {
  class: `flex-1`,
};
const Te = {
  class: `flex items-center justify-between`,
};
const Ee = {
  class: `flex items-center justify-between`,
};
const De = {
  class: `flex gap-1`,
};
const Oe = {
  key: 1,
  class: `space-y-4`,
};
const ke = {
  key: 0,
  class: `flex justify-center`,
};
const Ae = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const je = {
  class: `p-6`,
};
const Me = {
  class: `mb-6`,
};
const Ne = {
  class: `flex justify-end gap-3`,
};
const Y = 50;
const X = k({
  __name: `history`,
  async setup(e) {
    let l;
    let d;
    r({
      title: `Monte Carlo History - Jesse`,
    });
    let x = ot();
    let E = st();
    let j = n_2();
    let M = vn([]);
    let N = vn(false);
    let P = vn(null);
    let F = vn(false);
    let I = vn(false);
    let L = vn(true);
    let R = vn(0);
    let z = vn(false);
    let B = vn(null);
    let V = vn(false);
    let H = vn(false);
    let U = vn(30);
    let W = g({
      get: () => x.query.title || ``,
      set: (e) => {
        let t = {
          ...x.query,
        };
        if (e) {
          t.title = e;
        } else {
          delete t.title;
        }
        E.push({
          query: t,
        });
      },
    });
    let G = g({
      get: () => x.query.status || `all`,
      set: (e) => {
        let t = {
          ...x.query,
        };
        if (e === `all`) {
          delete t.status;
        } else {
          t.status = e;
        }
        E.push({
          query: t,
        });
      },
    });
    let K = g({
      get: () => x.query.dateRange || `all_time`,
      set: (e) => {
        let t = {
          ...x.query,
        };
        if (e === `all_time`) {
          delete t.dateRange;
        } else {
          t.dateRange = e;
        }
        E.push({
          query: t,
        });
      },
    });
    let q = [
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
        label: `Terminated`,
        value: `terminated`,
      },
    ];
    let J = [
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
    let X = [
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
    F.value = true;
    [l, d] = Kt(() =>
      C(`/monte-carlo/sessions`, {
        method: `POST`,
        body: {
          limit: Y,
          offset: 0,
          title_search: W.value || null,
          status_filter: G.value === `all` ? null : G.value,
          date_filter: K.value === `all_time` ? null : K.value,
        },
        authenticated: true,
      }),
    );
    l = await l;
    d();
    let Z = l;
    if (Z.error.value) {
      D_2(Z.error.value);
    } else {
      M.value = Z.data.value?.sessions ?? [];
      R.value = M.value.length;
      L.value = M.value.length === Y;
    }
    F.value = false;
    let Pe = X_1(() => {
      R.value = 0;
      Q();
    }, 300);
    Ht(W, () => {
      Pe();
    });
    Ht(G, () => {
      R.value = 0;
      Q();
    });
    Ht(K, () => {
      R.value = 0;
      Q();
    });
    async function Q() {
      F.value = true;
      try {
        let e = (
          await S(`/monte-carlo/sessions`, {
            method: `POST`,
            body: {
              limit: Y,
              offset: 0,
              title_search: W.value || null,
              status_filter: G.value === `all` ? null : G.value,
              date_filter: K.value === `all_time` ? null : K.value,
            },
            authenticated: true,
          })
        ).data.value;
        M.value = e?.sessions || [];
        R.value = M.value.length;
        L.value = e?.sessions?.length === Y;
      } catch (e) {
        D_2(e);
      } finally {
        F.value = false;
      }
    }
    async function $() {
      I.value = true;
      try {
        let e =
          (
            await S(`/monte-carlo/sessions`, {
              method: `POST`,
              body: {
                limit: Y,
                offset: R.value,
                title_search: W.value || null,
                status_filter: G.value === `all` ? null : G.value,
                date_filter: K.value === `all_time` ? null : K.value,
              },
              authenticated: true,
            })
          ).data.value?.sessions || [];
        M.value = [...M.value, ...e];
        R.value += e.length;
        L.value = e.length === Y;
      } catch (e) {
        D_2(e);
      } finally {
        I.value = false;
      }
    }
    async function onLoad(e) {
      await it(`/monte-carlo/${e}`);
    }
    function onDelete(e) {
      P.value = e;
      N.value = true;
    }
    async function Le() {
      if (P.value) {
        await Re(P.value);
        M.value = M.value.filter((e) => e.id !== P.value);
        --R.value;
      }
      N.value = false;
      P.value = null;
    }
    async function Re(e) {
      if (e === j.form.id) {
        O(`error`, `Cannot delete the current session.`);
        return;
      }
      try {
        let t = await S(`/monte-carlo/sessions/${e}/remove`, {
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
      B.value = e;
      z.value = true;
    }
    async function Be() {
      H.value = true;
      try {
        let e = await S(`/monte-carlo/purge-sessions`, {
          method: `POST`,
          body: {
            days_old: U.value === -1 ? null : U.value,
          },
          authenticated: true,
        });
        if (e.error.value) {
          D_2(e.error.value);
          return;
        }
        let t = e.data.value;
        O(`success`, `Successfully purged ${t.deleted_count} session(s)`);
        V.value = false;
        R.value = 0;
        await Q();
      } catch (e) {
        D_2(e);
      } finally {
        H.value = false;
      }
    }
    function Ve() {
      V.value = false;
      U.value = 30;
    }
    function He(e) {
      if (B.value) {
        let t = M.value.find((e) => e.id === B.value.id);
        if (t) {
          t.title = e.title;
          t.description = e.description;
          if (e.strategyCodes) {
            t.strategy_codes = e.strategyCodes;
          }
          B.value.title = e.title;
          B.value.description = e.description;
          if (e.strategyCodes) {
            B.value.strategy_codes = e.strategyCodes;
          }
        }
      }
    }
    return (e, n) => {
      let r = t_5;
      let c = t;
      let l = t_4;
      let d = t_8;
      let g = ce;
      let v = t_2;
      let y = t_11;
      let b = t_6;
      let x = t_3;
      let S = t_10;
      mt();
      return v_1(S, null, {
        default: qt(() => [
          _(`div`, le, [
            _(`div`, ue, [
              (n[9] ||= _(
                `h1`,
                {
                  class: `text-xl md:text-2xl font-bold text-gray-900 dark:text-white`,
                },
                ` Monte Carlo History `,
                -1,
              )),
              D(r, {
                icon: `i-heroicons-trash`,
                color: `error`,
                variant: `soft`,
                size: `sm`,
                label: `Purge`,
                onClick: (n[0] ||= (e) => (V.value = true)),
              }),
            ]),
            _(`div`, de, [
              D(
                c,
                {
                  modelValue: On(W),
                  "onUpdate:modelValue": (n[1] ||= (e) => {
                    if (un(W)) {
                      return (W.value = e);
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
              D(
                l,
                {
                  modelValue: On(G),
                  "onUpdate:modelValue": (n[2] ||= (e) => {
                    if (un(G)) {
                      return (G.value = e);
                    }
                    return null;
                  }),
                  items: q,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
              D(
                l,
                {
                  modelValue: On(K),
                  "onUpdate:modelValue": (n[3] ||= (e) => {
                    if (un(K)) {
                      return (K.value = e);
                    }
                    return null;
                  }),
                  items: J,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
            ]),
          ]),
          On(F)
            ? (mt(),
              b_1(`div`, fe, [
                _(`div`, pe, [
                  _(`div`, me, [
                    (mt(),
                    b_1(
                      o,
                      null,
                      bt(5, (key) =>
                        _(
                          `div`,
                          {
                            key,
                            class: `p-4`,
                          },
                          [
                            _(`div`, he, [
                              _(`div`, ge, [
                                D(d, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D(d, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              _(`div`, _e, [
                                D(d, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D(d, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              _(`div`, ve, [
                                D(d, {
                                  class: `h-4 w-16 mx-auto`,
                                }),
                              ]),
                              _(`div`, ye, [
                                D(d, {
                                  class: `h-6 w-20 mx-auto`,
                                }),
                              ]),
                              _(`div`, be, [
                                D(d, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              _(`div`, xe, [
                                D(d, {
                                  class: `h-8 w-8`,
                                }),
                                D(d, {
                                  class: `h-8 w-8`,
                                }),
                                D(d, {
                                  class: `h-8 w-8`,
                                }),
                              ]),
                            ]),
                            _(`div`, Se, [
                              _(`div`, Ce, [
                                _(`div`, we, [
                                  D(d, {
                                    class: `h-4 w-3/4 mb-2`,
                                  }),
                                  D(d, {
                                    class: `h-3 w-1/2`,
                                  }),
                                ]),
                                D(d, {
                                  class: `h-6 w-16 ml-2`,
                                }),
                              ]),
                              _(`div`, Te, [
                                D(d, {
                                  class: `h-4 w-24`,
                                }),
                                D(d, {
                                  class: `h-4 w-16`,
                                }),
                              ]),
                              _(`div`, Ee, [
                                D(d, {
                                  class: `h-3 w-32`,
                                }),
                                _(`div`, De, [
                                  D(d, {
                                    class: `h-8 w-8`,
                                  }),
                                  D(d, {
                                    class: `h-8 w-8`,
                                  }),
                                  D(d, {
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
            : On(M).length
              ? (mt(),
                b_1(`div`, Oe, [
                  D(
                    g,
                    {
                      sessions: On(M),
                      onNotes,
                      onLoad,
                      onDelete,
                    },
                    null,
                    8,
                    [`sessions`],
                  ),
                  On(L)
                    ? (mt(),
                      b_1(`div`, ke, [
                        D(
                          r,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(I),
                            onClick: $,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : !On(F) && On(M).length === 0
                ? (mt(),
                  b_1(`div`, Ae, [
                    ...(n[10] ||= [
                      _(
                        `div`,
                        {
                          class: `text-gray-400 dark:text-gray-500`,
                        },
                        [
                          _(`i`, {
                            class: `i-heroicons-clock h-12 w-12 mx-auto mb-4`,
                          }),
                          _(
                            `p`,
                            {
                              class: `text-lg`,
                            },
                            `No Monte Carlo history found`,
                          ),
                          _(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Run a Monte Carlo simulation or change filters to see items in your history`,
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]))
                : y_1(``, true),
          D(
            v,
            {
              modelValue: On(N),
              "onUpdate:modelValue": (n[4] ||= (e) => {
                if (un(N)) {
                  return (N.value = e);
                }
                return null;
              }),
              title: `Delete Monte Carlo Session`,
              description: `Are you sure you want to delete this Monte Carlo session? This action cannot be undone.`,
              type: `info`,
            },
            {
              default: qt(() => [
                D(r, {
                  variant: `solid`,
                  color: `error`,
                  block: ``,
                  class: `sm:w-auto`,
                  label: `Delete`,
                  onClick: Le,
                }),
              ]),
              _: 1,
            },
            8,
            [`modelValue`],
          ),
          On(B)
            ? (mt(),
              v_1(
                y,
                {
                  key: 3,
                  modelValue: On(z),
                  "onUpdate:modelValue": (n[5] ||= (e) => {
                    if (un(z)) {
                      return (z.value = e);
                    }
                    return null;
                  }),
                  "session-id": On(B).id,
                  "initial-title": On(B).title,
                  "initial-description": On(B).description,
                  "initial-strategy-codes": On(B).strategy_codes,
                  onSaved: (n[6] ||= (e) =>
                    He({
                      title: ``,
                      description: ``,
                      strategyCodes: null,
                    })),
                },
                null,
                8,
                [
                  `modelValue`,
                  `session-id`,
                  `initial-title`,
                  `initial-description`,
                  `initial-strategy-codes`,
                ],
              ))
            : y_1(``, true),
          D(
            x,
            {
              open: On(V),
              "onUpdate:open": (n[8] ||= (e) => {
                if (un(V)) {
                  return (V.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                _(`div`, je, [
                  (n[13] ||= _(
                    `h3`,
                    {
                      class: `text-lg font-semibold text-gray-900 dark:text-white mb-4`,
                    },
                    ` Purge Monte Carlo Sessions `,
                    -1,
                  )),
                  _(`div`, Me, [
                    (n[11] ||= _(
                      `div`,
                      {
                        class: `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4`,
                      },
                      [
                        _(
                          `div`,
                          {
                            class: `flex items-start gap-3`,
                          },
                          [
                            _(`i`, {
                              class: `i-heroicons-exclamation-triangle text-red-600 dark:text-red-400 text-xl shrink-0 mt-0.5`,
                            }),
                            _(
                              `div`,
                              {
                                class: `text-sm text-red-800 dark:text-red-200`,
                              },
                              [
                                _(
                                  `p`,
                                  {
                                    class: `font-semibold mb-1`,
                                  },
                                  ` Warning: This action is permanent! `,
                                ),
                                _(
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
                    D(
                      b,
                      {
                        label: `Delete sessions older than:`,
                        class: `mb-4`,
                      },
                      {
                        default: qt(() => [
                          D(
                            l,
                            {
                              modelValue: On(U),
                              "onUpdate:modelValue": (n[7] ||= (e) => {
                                if (un(U)) {
                                  return (U.value = e);
                                }
                                return null;
                              }),
                              items: X,
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
                    (n[12] ||= _(
                      `p`,
                      {
                        class: `text-sm text-gray-600 dark:text-gray-400`,
                      },
                      ` This will permanently delete all Monte Carlo sessions that match your criteria. `,
                      -1,
                    )),
                  ]),
                  _(`div`, Ne, [
                    D(r, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: Ve,
                    }),
                    D(
                      r,
                      {
                        color: `error`,
                        label: `Purge Sessions`,
                        loading: On(H),
                        onClick: Be,
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
