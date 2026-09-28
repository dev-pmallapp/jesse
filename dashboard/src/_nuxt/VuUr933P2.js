import {
  B as B_1,
  D,
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
import { C, D as D_2, O, S, X as X_1, u, w } from "./B8_r5oP7.js";
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
import { t as t_11 } from "./CcEz-6AP2.js";
const N = {
  class: `bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-xs`,
};
const P = {
  class: `flex flex-col`,
};
const F = {
  class: `font-medium text-gray-900 dark:text-white truncate`,
};
const I = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const L = {
  class: `flex flex-col items-center`,
};
const R = {
  class: `text-sm font-medium text-gray-900 dark:text-white`,
};
const z = {
  class: `flex justify-center`,
};
const B = {
  class: `flex justify-center`,
};
const V = {
  key: 0,
  class: `text-sm font-medium text-gray-900 dark:text-white`,
};
const H = {
  key: 1,
  class: `text-sm text-gray-400 dark:text-gray-500`,
};
const U = {
  class: `text-sm text-gray-500 dark:text-gray-400`,
};
const W = {
  class: `flex items-center justify-end gap-1`,
};
const G = Object.assign(
  k({
    __name: `OptimizationSessionsTable`,
    props: {
      sessions: {},
    },
    emits: [`notes`, `load`, `delete`],
    setup(n) {
      let r = n;
      let s = t_5;
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
          id: `progress`,
          header: `Progress`,
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
          accessorKey: `best_score`,
          header: `Best Score`,
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
        r.sessions.map((e) => ({
          id: e.id,
          title: e.title,
          strategy: e.state?.form?.routes?.[0]?.strategy || `N/A`,
          exchange: e.state?.form?.exchange || `N/A`,
          completed_trials: e.completed_trials || 0,
          total_trials: e.total_trials || 0,
          status: e.status,
          best_score: e.best_score,
          created_at: e.created_at,
          rawSession: e,
        })),
      );
      function _(e) {
        switch (e) {
          case `finished`:
            return `success`;
          case `running`:
            return `info`;
          case `stopped`:
            return `error`;
          case `terminated`:
            return `warning`;
          default:
            return `neutral`;
        }
      }
      return (e, n) => {
        let r = t_7;
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
                __1(`div`, P, [
                  __1(
                    `span`,
                    F,
                    nr(
                      row.original.title || row.original.strategy || `Untitled`,
                    ),
                    1,
                  ),
                  __1(`span`, I, nr(row.original.exchange), 1),
                ]),
              ]),
              "progress-cell": qt(({ row }) => [
                __1(`div`, L, [
                  __1(
                    `span`,
                    R,
                    nr(row.original.completed_trials) +
                      ` / ` +
                      nr(row.original.total_trials),
                    1,
                  ),
                  (n[1] ||= __1(
                    `span`,
                    {
                      class: `text-xs text-gray-500 dark:text-gray-400`,
                    },
                    ` trials `,
                    -1,
                  )),
                ]),
              ]),
              "status-cell": qt(({ row }) => [
                __1(`div`, z, [
                  D(
                    r,
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
              "best_score-cell": qt(({ row }) => [
                __1(`div`, B, [
                  row.original.best_score !== null &&
                  row.original.best_score !== undefined
                    ? (mt(),
                      b_1(
                        `span`,
                        V,
                        nr(
                          typeof row.original.best_score == `number`
                            ? row.original.best_score.toFixed(2)
                            : row.original.best_score,
                        ),
                        1,
                      ))
                    : (mt(), b_1(`span`, H, ` N/A `)),
                ]),
              ]),
              "created_at-cell": qt(({ row }) => [
                __1(
                  `span`,
                  U,
                  nr(
                    On(w).timestampToReadableDateTime(row.original.created_at),
                  ),
                  1,
                ),
              ]),
              "actions-cell": qt(({ row }) => [
                __1(`div`, W, [
                  D(
                    c,
                    {
                      text: `Add Note`,
                    },
                    {
                      default: qt(() => [
                        D(
                          On(s),
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
                          On(s),
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
                          On(s),
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
    __name: `OptimizationSessionsTable`,
  },
);
const K = {
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
  class: `col-span-2 text-center`,
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
const q = {
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
  class: `text-center py-12`,
};
const Oe = {
  class: `text-gray-400 dark:text-gray-500 text-sm`,
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
const J = 50;
const Y = k({
  __name: `history`,
  async setup(e) {
    let l;
    let x;
    r({
      title: `Optimization History - Jesse`,
    });
    let T = ot();
    let k = st();
    let j = u();
    let N = vn([]);
    let P = vn(false);
    let F = vn(null);
    let I = vn(false);
    let L = vn(false);
    let R = vn(true);
    let z = vn(0);
    let B = vn(false);
    let V = vn(null);
    let H = vn(false);
    let U = vn(false);
    let W = vn(30);
    let Y = g({
      get: () => T.query.title || ``,
      set: (e) => {
        let t = {
          ...T.query,
        };
        if (e) {
          t.title = e;
        } else {
          delete t.title;
        }
        k.push({
          query: t,
        });
      },
    });
    let X = g({
      get: () => T.query.status || `all`,
      set: (e) => {
        let t = {
          ...T.query,
        };
        if (e === `all`) {
          delete t.status;
        } else {
          t.status = e;
        }
        k.push({
          query: t,
        });
      },
    });
    let Z = g({
      get: () => T.query.dateRange || `all_time`,
      set: (e) => {
        let t = {
          ...T.query,
        };
        if (e === `all_time`) {
          delete t.dateRange;
        } else {
          t.dateRange = e;
        }
        k.push({
          query: t,
        });
      },
    });
    let Me = [
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
        label: `Terminated`,
        value: `terminated`,
      },
      {
        label: `Stopped`,
        value: `stopped`,
      },
    ];
    let Ne = [
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
    let Pe = [
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
    I.value = true;
    [l, x] = Kt(() =>
      C(`/optimization/sessions`, {
        method: `POST`,
        body: {
          limit: J,
          offset: 0,
          title_search: Y.value || null,
          status_filter: X.value === `all` ? null : X.value,
          date_filter: Z.value === `all_time` ? null : Z.value,
        },
        authenticated: true,
      }),
    );
    l = await l;
    x();
    let Q = l;
    if (Q.error.value) {
      D_2(Q.error.value);
    } else {
      N.value = Q.data.value?.sessions ?? [];
      z.value = N.value.length;
      R.value = N.value.length === J;
    }
    I.value = false;
    let Fe = X_1(() => {
      z.value = 0;
      N.value = [];
      R.value = true;
      $();
    }, 300);
    Ht(Y, () => {
      Fe();
    });
    Ht(X, () => {
      z.value = 0;
      N.value = [];
      R.value = true;
      $();
    });
    Ht(Z, () => {
      z.value = 0;
      N.value = [];
      R.value = true;
      $();
    });
    async function $() {
      I.value = true;
      try {
        let e = await j.getSessions(J, z.value, {
          title_search: Y.value || undefined,
          status_filter: X.value === `all` ? undefined : X.value,
          date_filter: Z.value === `all_time` ? undefined : Z.value,
        });
        if (z.value === 0) {
          N.value = e;
        } else {
          N.value.push(...e);
        }
        R.value = e.length === J;
      } catch (e) {
        D_2(e);
      } finally {
        I.value = false;
      }
    }
    async function Ie() {
      L.value = true;
      z.value += J;
      try {
        let e = await j.getSessions(J, z.value, {
          title_search: Y.value || undefined,
          status_filter: X.value === `all` ? undefined : X.value,
          date_filter: Z.value === `all_time` ? undefined : Z.value,
        });
        N.value.push(...e);
        R.value = e.length === J;
      } catch (e) {
        D_2(e);
      } finally {
        L.value = false;
      }
    }
    function onDelete(e) {
      F.value = e;
      P.value = true;
    }
    async function Re() {
      if (F.value) {
        try {
          let { data: e, error: t } = await S(
            `/optimization/sessions/${F.value}/remove`,
            {
              method: `POST`,
              authenticated: true,
            },
          );
          if (t.value) {
            D_2(t.value);
            return;
          }
          N.value = N.value.filter((e) => e.id !== F.value);
          O(`success`, `Session deleted successfully`);
          P.value = false;
          F.value = null;
        } catch (e) {
          D_2(e);
        }
      }
    }
    async function onLoad(e) {
      await it(`/optimization/${e}`);
    }
    function onNotes(e) {
      V.value = e;
      B.value = true;
    }
    async function onSaved(e) {
      if (V.value) {
        V.value.title = e.title;
        V.value.description = e.description;
        let t = N.value.findIndex((e) => e.id === V.value?.id);
        if (t !== -1) {
          N.value[t] = {
            ...V.value,
          };
        }
      }
    }
    async function He() {
      U.value = true;
      try {
        let e = W.value === -1 ? null : W.value;
        let t = await j.purgeOptimizationSessions(e);
        if (t.success) {
          O(`success`, `Successfully purged ${t.deleted_count} session(s)`);
          H.value = false;
          z.value = 0;
          N.value = [];
          R.value = true;
          await $();
        }
      } catch (e) {
        D_2(e);
      } finally {
        U.value = false;
      }
    }
    function Ue() {
      H.value = false;
      W.value = 30;
    }
    return (e, n) => {
      let r = t_5;
      let c = t;
      let l = t_4;
      let g = t_8;
      let v = G;
      let y = t_2;
      let b = t_11;
      let x = t_6;
      let S = t_3;
      let C = t_10;
      mt();
      return v_1(C, null, {
        default: qt(() => [
          __1(`div`, K, [
            __1(`div`, ce, [
              (n[8] ||= __1(
                `h1`,
                {
                  class: `text-xl md:text-2xl font-bold text-gray-900 dark:text-white`,
                },
                ` Optimization History `,
                -1,
              )),
              D(r, {
                icon: `i-heroicons-trash`,
                color: `error`,
                variant: `soft`,
                size: `sm`,
                label: `Purge`,
                onClick: (n[0] ||= (e) => (H.value = true)),
              }),
            ]),
            __1(`div`, le, [
              D(
                c,
                {
                  modelValue: On(Y),
                  "onUpdate:modelValue": (n[1] ||= (e) => {
                    if (un(Y)) {
                      return (Y.value = e);
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
                  modelValue: On(X),
                  "onUpdate:modelValue": (n[2] ||= (e) => {
                    if (un(X)) {
                      return (X.value = e);
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
              D(
                l,
                {
                  modelValue: On(Z),
                  "onUpdate:modelValue": (n[3] ||= (e) => {
                    if (un(Z)) {
                      return (Z.value = e);
                    }
                    return null;
                  }),
                  items: Ne,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
            ]),
          ]),
          On(I)
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
                                D(g, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D(g, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, he, [
                                D(g, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D(g, {
                                  class: `h-3 w-2/3 mx-auto`,
                                }),
                              ]),
                              __1(`div`, ge, [
                                D(g, {
                                  class: `h-6 w-20 mx-auto`,
                                }),
                              ]),
                              __1(`div`, _e, [
                                D(g, {
                                  class: `h-4 w-16 mx-auto`,
                                }),
                              ]),
                              __1(`div`, ve, [
                                D(g, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, q, [
                                D(g, {
                                  class: `h-8 w-8`,
                                }),
                                D(g, {
                                  class: `h-8 w-8`,
                                }),
                                D(g, {
                                  class: `h-8 w-8`,
                                }),
                              ]),
                            ]),
                            __1(`div`, ye, [
                              __1(`div`, be, [
                                __1(`div`, xe, [
                                  D(g, {
                                    class: `h-4 w-3/4 mb-2`,
                                  }),
                                  D(g, {
                                    class: `h-3 w-1/2`,
                                  }),
                                ]),
                                D(g, {
                                  class: `h-6 w-16 ml-2`,
                                }),
                              ]),
                              __1(`div`, Se, [
                                D(g, {
                                  class: `h-4 w-24`,
                                }),
                                D(g, {
                                  class: `h-4 w-16`,
                                }),
                              ]),
                              __1(`div`, Ce, [
                                D(g, {
                                  class: `h-3 w-32`,
                                }),
                                __1(`div`, we, [
                                  D(g, {
                                    class: `h-8 w-8`,
                                  }),
                                  D(g, {
                                    class: `h-8 w-8`,
                                  }),
                                  D(g, {
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
            : On(N).length > 0
              ? (mt(),
                b_1(`div`, Te, [
                  D(
                    v,
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
                  On(R)
                    ? (mt(),
                      b_1(`div`, Ee, [
                        D(
                          r,
                          {
                            label: `Load More`,
                            icon: `i-heroicons-arrow-down`,
                            color: `neutral`,
                            variant: `soft`,
                            size: `lg`,
                            loading: On(L),
                            onClick: Ie,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : (mt(),
                b_1(`div`, De, [
                  (n[9] ||= __1(
                    `div`,
                    {
                      class: `text-gray-400 dark:text-gray-500 text-lg mb-2`,
                    },
                    ` No optimization sessions found `,
                    -1,
                  )),
                  __1(
                    `div`,
                    Oe,
                    nr(
                      On(Y) || On(X) !== `all` || On(Z) !== `all_time`
                        ? `Try adjusting your filters`
                        : `Start an optimization to see results here`,
                    ),
                    1,
                  ),
                ])),
          D(
            y,
            {
              modelValue: On(P),
              "onUpdate:modelValue": (n[4] ||= (e) => {
                if (un(P)) {
                  return (P.value = e);
                }
                return null;
              }),
              title: `Delete Optimization Session`,
              description: `Are you sure you want to delete this optimization session? This action cannot be undone.`,
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
                  onClick: Re,
                }),
              ]),
              _: 1,
            },
            8,
            [`modelValue`],
          ),
          On(V)
            ? (mt(),
              v_1(
                b,
                {
                  key: 3,
                  modelValue: On(B),
                  "onUpdate:modelValue": (n[5] ||= (e) => {
                    if (un(B)) {
                      return (B.value = e);
                    }
                    return null;
                  }),
                  "session-id": On(V).id,
                  "initial-title": On(V).title,
                  "initial-description": On(V).description,
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
          D(
            S,
            {
              open: On(H),
              "onUpdate:open": (n[7] ||= (e) => {
                if (un(H)) {
                  return (H.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                __1(`div`, ke, [
                  __1(`div`, Ae, [
                    (n[10] ||= __1(
                      `h3`,
                      {
                        class: `text-lg font-semibold mb-2`,
                      },
                      `Purge Optimization Sessions`,
                      -1,
                    )),
                    (n[11] ||= __1(
                      `div`,
                      {
                        class: `bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4`,
                      },
                      [
                        __1(
                          `div`,
                          {
                            class: `flex`,
                          },
                          [
                            __1(
                              `div`,
                              {
                                class: `shrink-0`,
                              },
                              [
                                __1(
                                  `svg`,
                                  {
                                    class: `h-5 w-5 text-yellow-400`,
                                    viewBox: `0 0 20 20`,
                                    fill: `currentColor`,
                                  },
                                  [
                                    __1(`path`, {
                                      "fill-rule": `evenodd`,
                                      d: `M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z`,
                                      "clip-rule": `evenodd`,
                                    }),
                                  ],
                                ),
                              ],
                            ),
                            __1(
                              `div`,
                              {
                                class: `ml-3`,
                              },
                              [
                                __1(
                                  `h3`,
                                  {
                                    class: `text-sm font-medium text-yellow-800 dark:text-yellow-200`,
                                  },
                                  `Warning`,
                                ),
                                __1(
                                  `p`,
                                  {
                                    class: `mt-1 text-sm text-yellow-700 dark:text-yellow-300`,
                                  },
                                  ` This action will permanently delete optimization sessions and cannot be undone. `,
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
                    D(
                      x,
                      {
                        label: `Delete sessions older than:`,
                        class: `mb-4`,
                      },
                      {
                        default: qt(() => [
                          D(
                            l,
                            {
                              modelValue: On(W),
                              "onUpdate:modelValue": (n[6] ||= (e) => {
                                if (un(W)) {
                                  return (W.value = e);
                                }
                                return null;
                              }),
                              items: Pe,
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
                      ` This will permanently delete all optimization sessions that match your criteria. `,
                      -1,
                    )),
                  ]),
                  __1(`div`, je, [
                    D(r, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: Ue,
                    }),
                    D(
                      r,
                      {
                        color: `error`,
                        label: `Purge Sessions`,
                        loading: On(U),
                        onClick: He,
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
export { Y as default };
