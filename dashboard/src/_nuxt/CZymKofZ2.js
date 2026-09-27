import {
  B as B_1,
  D as D_1,
  Ht,
  Kt,
  On,
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
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { it, ot, st } from "./Cd-sGgPF.js";
import { n as n_1, t } from "./2k_QeT3T.js";
import { C, D as D_2, O, S, X as X_1, w } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_2 } from "./atteXEGs.js";
import { t as t_3 } from "./OaeI3Ulg.js";
import { t as t_4 } from "./pQUz-uq3.js";
import { t as t_5 } from "./CJNUlr67.js";
import { t as t_6 } from "./BG8CfSEZ2.js";
import { t as t_7 } from "./B4Wc4BFL2.js";
import { t as t_8 } from "./gG0NvZLm2.js";
import { t as t_9 } from "./25FdeeAd.js";
import { t as t_10 } from "./BWDSh1SW.js";
import { t as t_11 } from "./DqT4cj-J.js";
import { t as t_12 } from "./qBoaT7Fk2.js";
const P = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const F = {
  class: `flex flex-col`,
};
const I = {
  class: `text-sm font-medium text-gray-900 dark:text-white`,
};
const L = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const R = {
  class: `flex flex-col`,
};
const z = {
  class: `text-sm text-gray-700 dark:text-gray-300`,
};
const B = {
  class: `text-xs text-gray-500 dark:text-gray-400`,
};
const V = {
  class: `flex justify-center`,
};
const H = {
  key: 0,
  class: `text-sm font-mono`,
};
const U = {
  key: 1,
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
const se = Object.assign(
  k({
    __name: `SignificanceTestSessionsTable`,
    props: {
      sessions: {},
    },
    emits: [`notes`, `load`, `delete`],
    setup(n) {
      let r = t_5;
      let s = n;
      let l = vn([
        {
          id: `updated_at`,
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
          accessorKey: `p_value`,
          header: `p-value`,
          meta: {
            class: {
              th: `text-center`,
              td: `text-center`,
            },
          },
        },
        {
          accessorKey: `n_simulations`,
          header: `Simulations`,
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
          accessorKey: `updated_at`,
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
          p_value: e.results?.p_value ?? null,
          n_simulations:
            e.results?.n_simulations ?? e.state?.form?.n_simulations ?? null,
          status: e.status,
          updated_at: w.timestampToReadableDateTime(e.updated_at),
          rawSession: e,
        })),
      );
      function _(e) {
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
        let g = t_10;
        mt();
        return b_1(`div`, P, [
          D_1(
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
                __1(`div`, F, [
                  __1(
                    `span`,
                    I,
                    nr(
                      row.original.title ||
                        row.original.strategy ||
                        `Unknown Strategy`,
                    ),
                    1,
                  ),
                  __1(
                    `span`,
                    L,
                    nr(row.original.exchange || `Unknown Exchange`),
                    1,
                  ),
                ]),
              ]),
              "session-cell": qt(({ row }) => [
                __1(`div`, R, [
                  __1(`span`, z, nr(row.original.symbol || `N/A`), 1),
                  __1(`span`, B, nr(row.original.timeframe || `N/A`), 1),
                ]),
              ]),
              "p_value-cell": qt(({ row }) => [
                __1(`div`, V, [
                  row.original.p_value == null
                    ? (mt(), b_1(`span`, U, `-`))
                    : (mt(),
                      b_1(`span`, H, nr(row.original.p_value.toFixed(4)), 1)),
                ]),
              ]),
              "n_simulations-cell": qt(({ row }) => [
                __1(`div`, W, [
                  __1(`span`, G, nr(row.original.n_simulations ?? `-`), 1),
                ]),
              ]),
              "status-cell": qt(({ row }) => [
                __1(`div`, K, [
                  D_1(
                    s,
                    {
                      color: _(row.original.status),
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
              "updated_at-cell": qt(({ row }) => [
                __1(`span`, q, nr(row.original.updated_at), 1),
              ]),
              "actions-cell": qt(({ row }) => [
                __1(`div`, J, [
                  D_1(
                    c,
                    {
                      text: `Add Note`,
                    },
                    {
                      default: qt(() => [
                        D_1(
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
                  D_1(
                    c,
                    {
                      text: `Load Session`,
                    },
                    {
                      default: qt(() => [
                        D_1(
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
                  D_1(
                    c,
                    {
                      text: `Delete`,
                    },
                    {
                      default: qt(() => [
                        D_1(
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
    __name: `SignificanceTestSessionsTable`,
  },
);
const ce = {
  class: `mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`,
};
const le = {
  class: `flex items-center gap-3`,
};
const ue = {
  class: `flex flex-col gap-3 sm:flex-row sm:items-center`,
};
const de = {
  key: 0,
  class: `space-y-4`,
};
const fe = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const Y = {
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
const _e = {
  class: `col-span-2 text-center`,
};
const ve = {
  class: `col-span-2`,
};
const ye = {
  class: `col-span-1 flex justify-end gap-2`,
};
const be = {
  class: `md:hidden space-y-3`,
};
const xe = {
  class: `flex items-start justify-between`,
};
const Se = {
  class: `flex-1`,
};
const Ce = {
  class: `flex items-center justify-between`,
};
const we = {
  class: `flex items-center justify-between`,
};
const Te = {
  class: `flex gap-1`,
};
const Ee = {
  key: 1,
  class: `space-y-4`,
};
const De = {
  key: 0,
  class: `flex justify-center`,
};
const Oe = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const ke = {
  class: `p-6`,
};
const Ae = {
  class: `mb-6`,
};
const je = {
  class: `flex justify-end gap-3`,
};
const X = 50;
const Z = k({
  __name: `history`,
  async setup(e) {
    let l;
    let d;
    r({
      title: `Significance Test History - Jesse`,
    });
    let x = ot();
    let D = st();
    t_8();
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
        D.push({
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
        D.push({
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
        D.push({
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
    let Z = [
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
      C(`/significance-test/sessions`, {
        method: `POST`,
        body: {
          limit: X,
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
    let Q = l;
    if (Q.error.value) {
      D_2(Q.error.value);
    } else {
      M.value = Q.data.value?.sessions ?? [];
      R.value = M.value.length;
      L.value = M.value.length === X;
    }
    F.value = false;
    let Me = X_1(() => {
      R.value = 0;
      $();
    }, 300);
    Ht(W, () => {
      Me();
    });
    Ht(G, () => {
      R.value = 0;
      $();
    });
    Ht(K, () => {
      R.value = 0;
      $();
    });
    async function $() {
      F.value = true;
      try {
        let e = (
          await S(`/significance-test/sessions`, {
            method: `POST`,
            body: {
              limit: X,
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
        L.value = e?.sessions?.length === X;
      } catch (e) {
        D_2(e);
      } finally {
        F.value = false;
      }
    }
    async function Ne() {
      I.value = true;
      try {
        let e =
          (
            await S(`/significance-test/sessions`, {
              method: `POST`,
              body: {
                limit: X,
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
        L.value = e.length === X;
      } catch (e) {
        D_2(e);
      } finally {
        I.value = false;
      }
    }
    async function onLoad(e) {
      await it(`/significance-test/${e}`);
    }
    function onDelete(e) {
      P.value = e;
      N.value = true;
    }
    async function Ie() {
      if (P.value) {
        try {
          let e = await S(`/significance-test/sessions/${P.value}/remove`, {
            method: `POST`,
            authenticated: true,
          });
          if (e.error.value) {
            D_2(e.error.value);
            return;
          }
          M.value = M.value.filter((e) => e.id !== P.value);
          --R.value;
          O(`success`, `Session deleted successfully`);
        } catch (e) {
          D_2(e);
        }
      }
      N.value = false;
      P.value = null;
    }
    function onNotes(e) {
      B.value = e;
      z.value = true;
    }
    async function Re() {
      H.value = true;
      try {
        let e = await S(`/significance-test/purge-sessions`, {
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
        await $();
      } catch (e) {
        D_2(e);
      } finally {
        H.value = false;
      }
    }
    function ze() {
      V.value = false;
      U.value = 30;
    }
    function onSaved(e) {
      if (B.value) {
        let t = M.value.find((e) => e.id === B.value.id);
        if (t) {
          t.title = e.title;
          t.description = e.description;
          B.value.title = e.title;
          B.value.description = e.description;
        }
      }
    }
    return (e, n) => {
      let r = t_5;
      let c = t;
      let l = t_4;
      let d = t_9;
      let g = se;
      let v = t_2;
      let y = t_12;
      let b = t_6;
      let x = t_3;
      let S = t_11;
      mt();
      return v_1(S, null, {
        default: qt(() => [
          __1(`div`, ce, [
            __1(`div`, le, [
              (n[8] ||= __1(
                `h1`,
                {
                  class: `text-xl md:text-2xl font-bold text-gray-900 dark:text-white`,
                },
                ` Significance Test History `,
                -1,
              )),
              D_1(r, {
                icon: `i-heroicons-trash`,
                color: `error`,
                variant: `soft`,
                size: `sm`,
                label: `Purge`,
                onClick: (n[0] ||= (e) => (V.value = true)),
              }),
            ]),
            __1(`div`, ue, [
              D_1(
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
              D_1(
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
              D_1(
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
              b_1(`div`, de, [
                __1(`div`, fe, [
                  __1(`div`, Y, [
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
                                D_1(d, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(d, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, he, [
                                D_1(d, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(d, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, ge, [
                                D_1(d, {
                                  class: `h-4 w-16 mx-auto`,
                                }),
                              ]),
                              __1(`div`, _e, [
                                D_1(d, {
                                  class: `h-6 w-20 mx-auto`,
                                }),
                              ]),
                              __1(`div`, ve, [
                                D_1(d, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, ye, [
                                D_1(d, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(d, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(d, {
                                  class: `h-8 w-8`,
                                }),
                              ]),
                            ]),
                            __1(`div`, be, [
                              __1(`div`, xe, [
                                __1(`div`, Se, [
                                  D_1(d, {
                                    class: `h-4 w-3/4 mb-2`,
                                  }),
                                  D_1(d, {
                                    class: `h-3 w-1/2`,
                                  }),
                                ]),
                                D_1(d, {
                                  class: `h-6 w-16 ml-2`,
                                }),
                              ]),
                              __1(`div`, Ce, [
                                D_1(d, {
                                  class: `h-4 w-24`,
                                }),
                                D_1(d, {
                                  class: `h-4 w-16`,
                                }),
                              ]),
                              __1(`div`, we, [
                                D_1(d, {
                                  class: `h-3 w-32`,
                                }),
                                __1(`div`, Te, [
                                  D_1(d, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(d, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(d, {
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
                b_1(`div`, Ee, [
                  D_1(
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
                      b_1(`div`, De, [
                        D_1(
                          r,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(I),
                            onClick: Ne,
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
                  b_1(`div`, Oe, [
                    ...(n[9] ||= [
                      __1(
                        `div`,
                        {
                          class: `text-gray-400 dark:text-gray-500`,
                        },
                        [
                          __1(`i`, {
                            class: `i-heroicons-beaker h-12 w-12 mx-auto mb-4`,
                          }),
                          __1(
                            `p`,
                            {
                              class: `text-lg`,
                            },
                            `No Significance Test history found`,
                          ),
                          __1(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Run a significance test or change filters to see items in your history`,
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]))
                : y_1(``, true),
          D_1(
            v,
            {
              modelValue: On(N),
              "onUpdate:modelValue": (n[4] ||= (e) => {
                if (un(N)) {
                  return (N.value = e);
                }
                return null;
              }),
              title: `Delete Significance Test Session`,
              description: `Are you sure you want to delete this session? This action cannot be undone.`,
              type: `info`,
            },
            {
              default: qt(() => [
                D_1(r, {
                  variant: `solid`,
                  color: `error`,
                  block: ``,
                  class: `sm:w-auto`,
                  label: `Delete`,
                  onClick: Ie,
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
            x,
            {
              open: On(V),
              "onUpdate:open": (n[7] ||= (e) => {
                if (un(V)) {
                  return (V.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                __1(`div`, ke, [
                  (n[12] ||= __1(
                    `h3`,
                    {
                      class: `text-lg font-semibold text-gray-900 dark:text-white mb-4`,
                    },
                    ` Purge Significance Test Sessions `,
                    -1,
                  )),
                  __1(`div`, Ae, [
                    (n[10] ||= __1(
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
                      b,
                      {
                        label: `Delete sessions older than:`,
                        class: `mb-4`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            l,
                            {
                              modelValue: On(U),
                              "onUpdate:modelValue": (n[6] ||= (e) => {
                                if (un(U)) {
                                  return (U.value = e);
                                }
                                return null;
                              }),
                              items: Z,
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
                    (n[11] ||= __1(
                      `p`,
                      {
                        class: `text-sm text-gray-600 dark:text-gray-400`,
                      },
                      ` This will permanently delete all Significance Test sessions that match your criteria. `,
                      -1,
                    )),
                  ]),
                  __1(`div`, je, [
                    D_1(r, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: ze,
                    }),
                    D_1(
                      r,
                      {
                        color: `error`,
                        label: `Purge Sessions`,
                        loading: On(H),
                        onClick: Re,
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
export { Z as default };
