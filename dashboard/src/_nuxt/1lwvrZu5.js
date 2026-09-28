import {
  D as D_1,
  Ht,
  Kt,
  On,
  _ as __1,
  b as b_1,
  bt,
  g,
  k as k_1,
  mt,
  o as o_1,
  qt,
  un,
  v as v_1,
  vn,
  y as y_1,
} from "./CoKk4mC0.js";
import { it, ot, st } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import {
  C as C_1,
  D as D_2,
  O as O_1,
  S as S_1,
  X as X_1,
  r,
} from "./B8_r5oP7.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { t as t_2 } from "./BpJ9fpSU.js";
import { t as t_3 } from "./atteXEGs.js";
import { t as t_4 } from "./OaeI3Ulg.js";
import { t as t_5 } from "./pQUz-uq3.js";
import { t as t_6 } from "./CJNUlr67.js";
import { t as t_7 } from "./BG8CfSEZ2.js";
import { t as t_8 } from "./25FdeeAd.js";
import { t as t_9 } from "./DqT4cj-J.js";
import { t as t_10 } from "./BapWjBt9.js";
import { t as t_11 } from "./Dp-2asp4.js";
const he = {
  class: `mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between`,
};
const ge = {
  class: `flex items-center gap-3`,
};
const _e = {
  class: `flex flex-col gap-3 sm:flex-row sm:items-center`,
};
const ve = {
  key: 0,
  class: `space-y-4`,
};
const ye = {
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden`,
};
const be = {
  class: `divide-y divide-gray-200 dark:divide-gray-700`,
};
const xe = {
  class: `hidden md:grid md:grid-cols-12 gap-4 items-center`,
};
const Se = {
  class: `col-span-3`,
};
const Ce = {
  class: `col-span-2`,
};
const we = {
  class: `col-span-1 text-center`,
};
const Te = {
  class: `col-span-2 text-center`,
};
const S = {
  class: `col-span-2`,
};
const C = {
  class: `col-span-2 flex justify-end gap-2`,
};
const w = {
  class: `md:hidden space-y-3`,
};
const T = {
  class: `flex items-start justify-between`,
};
const E = {
  class: `flex-1`,
};
const D = {
  class: `flex items-center justify-between`,
};
const O = {
  class: `flex items-center justify-between`,
};
const Ee = {
  class: `flex gap-1`,
};
const De = {
  key: 1,
  class: `space-y-4`,
};
const Oe = {
  key: 0,
  class: `flex justify-center`,
};
const ke = {
  key: 2,
  class: `bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center`,
};
const Ae = {
  class: `p-6`,
};
const je = {
  class: `mb-6`,
};
const Me = {
  class: `flex justify-end gap-3`,
};
const k = 50;
const A = k_1({
  __name: `history`,
  async setup(s) {
    let A;
    let j;
    r_2({
      title: `Sessions History - Jesse`,
    });
    let M = ot();
    let N = st();
    let P = r();
    let Ne = g(() => P.tabs);
    let F = vn([]);
    let I = vn(false);
    let L = vn(null);
    let R = vn(false);
    let z = vn(false);
    let B = vn(true);
    let V = vn(0);
    let H = vn(false);
    let U = vn(null);
    let W = vn(false);
    let G = vn(false);
    let K = vn(30);
    let q = g({
      get: () => M.query.title || ``,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e) {
          t.title = e;
        } else {
          delete t.title;
        }
        N.push({
          query: t,
        });
      },
    });
    let J = g({
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
    let Y = g({
      get: () => M.query.mode || `all`,
      set: (e) => {
        let t = {
          ...M.query,
        };
        if (e === `all`) {
          delete t.mode;
        } else {
          t.mode = e;
        }
        N.push({
          query: t,
        });
      },
    });
    let X = g({
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
    let Pe = [
      {
        label: `All Statuses`,
        value: `all`,
      },
      {
        label: `Running`,
        value: `running`,
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
    let Fe = [
      {
        label: `All Modes`,
        value: `all`,
      },
      {
        label: `Live Trading`,
        value: `livetrade`,
      },
      {
        label: `Paper Trading`,
        value: `papertrade`,
      },
    ];
    let Ie = [
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
    let Le = [
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
    let Re = g(() => F.value);
    R.value = true;
    [A, j] = Kt(() =>
      C_1(`/live/sessions`, {
        method: `POST`,
        body: {
          limit: k,
          offset: 0,
          title_search: q.value || null,
          status_filter: J.value === `all` ? null : J.value,
          mode_filter: Y.value === `all` ? null : Y.value,
          date_filter: X.value === `all_time` ? null : X.value,
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
      F.value = Z.data.value?.sessions ?? [];
      V.value = F.value.length;
      B.value = F.value.length === k;
    }
    R.value = false;
    let Q = X_1(() => {
      V.value = 0;
      $();
    }, 300);
    Ht(q, () => {
      Q();
    });
    Ht(J, () => {
      V.value = 0;
      $();
    });
    Ht(Y, () => {
      V.value = 0;
      $();
    });
    Ht(X, () => {
      V.value = 0;
      $();
    });
    async function $() {
      R.value = true;
      try {
        let e = (
          await S_1(`/live/sessions`, {
            method: `POST`,
            body: {
              limit: k,
              offset: 0,
              title_search: q.value || null,
              status_filter: J.value === `all` ? null : J.value,
              mode_filter: Y.value === `all` ? null : Y.value,
              date_filter: X.value === `all_time` ? null : X.value,
            },
            authenticated: true,
          })
        ).data.value;
        F.value = e?.sessions || [];
        V.value = F.value.length;
        B.value = e?.sessions?.length === k;
      } catch (e) {
        D_2(e);
      } finally {
        R.value = false;
      }
    }
    async function ze() {
      z.value = true;
      try {
        let e =
          (
            await S_1(`/live/sessions`, {
              method: `POST`,
              body: {
                limit: k,
                offset: V.value,
                title_search: q.value || null,
                status_filter: J.value === `all` ? null : J.value,
                mode_filter: Y.value === `all` ? null : Y.value,
                date_filter: X.value === `all_time` ? null : X.value,
              },
              authenticated: true,
            })
          ).data.value?.sessions || [];
        F.value = [...F.value, ...e];
        V.value += e.length;
        B.value = e.length === k;
      } catch (e) {
        D_2(e);
      } finally {
        z.value = false;
      }
    }
    function onNotes(e) {
      Ge(e.rawSession);
    }
    async function onLoad(e) {
      if (P.tabs[e]) {
        await it(`/live/${e}`);
        return;
      }
      if (await P.loadSession(e)) {
        await P.ensureTab(e);
        await it(`/live/${e}`);
      }
    }
    function onDelete(e) {
      L.value = e;
      I.value = true;
    }
    async function Ue() {
      if (L.value) {
        await We(L.value);
        F.value = F.value.filter((e) => e.id !== L.value);
        --V.value;
      }
      I.value = false;
      L.value = null;
    }
    async function We(e) {
      if (P.tabs[e]) {
        O_1(
          `error`,
          `Cannot delete a session that is currently open in a tab. Close the tab first.`,
        );
        return;
      }
      try {
        let t = await S_1(`/live/sessions/${e}/remove`, {
          method: `POST`,
          authenticated: true,
        });
        if (t.error.value) {
          D_2(t.error.value);
          return;
        }
        O_1(`success`, `Session deleted successfully`);
      } catch (e) {
        D_2(e);
      }
    }
    function Ge(e) {
      U.value = e;
      H.value = true;
    }
    async function Ke() {
      G.value = true;
      try {
        let e = await S_1(`/live/purge-sessions`, {
          method: `POST`,
          body: {
            days_old: K.value === -1 ? null : K.value,
          },
          authenticated: true,
        });
        if (e.error.value) {
          D_2(e.error.value);
          return;
        }
        let t = e.data.value;
        O_1(`success`, `Successfully purged ${t.deleted_count} session(s)`);
        W.value = false;
        V.value = 0;
        await $();
      } catch (e) {
        D_2(e);
      } finally {
        G.value = false;
      }
    }
    function qe() {
      W.value = false;
      K.value = 30;
    }
    function onSaved(e) {
      if (U.value) {
        let t = F.value.find((e) => e.id === U.value.id);
        if (t) {
          t.title = e.title;
          t.description = e.description;
          U.value.title = e.title;
          U.value.description = e.description;
        }
      }
    }
    return (t, n) => {
      let o = t_2;
      let s = t_6;
      let f = t_1;
      let m = t_5;
      let h = t_8;
      let g = t_11;
      let _ = t_3;
      let v = t_10;
      let y = t_7;
      let b = t_4;
      let x = t_9;
      mt();
      return v_1(x, null, {
        tabs: qt(() => [
          D_1(
            o,
            {
              "current-tab": null,
              tabs: On(Ne),
              onClose: On(P).closeTab,
              onCancel: On(P).cancel,
            },
            null,
            8,
            [`tabs`, `onClose`, `onCancel`],
          ),
        ]),
        default: qt(() => [
          __1(`div`, he, [
            __1(`div`, ge, [
              (n[9] ||= __1(
                `h1`,
                {
                  class: `text-xl md:text-2xl font-bold text-gray-900 dark:text-white`,
                },
                ` Sessions History `,
                -1,
              )),
              D_1(s, {
                icon: `i-heroicons-trash`,
                color: `error`,
                variant: `soft`,
                size: `sm`,
                label: `Purge`,
                onClick: (n[0] ||= (e) => (W.value = true)),
              }),
            ]),
            __1(`div`, _e, [
              D_1(
                f,
                {
                  modelValue: On(q),
                  "onUpdate:modelValue": (n[1] ||= (e) => {
                    if (un(q)) {
                      return (q.value = e);
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
                m,
                {
                  modelValue: On(J),
                  "onUpdate:modelValue": (n[2] ||= (e) => {
                    if (un(J)) {
                      return (J.value = e);
                    }
                    return null;
                  }),
                  items: Pe,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
              D_1(
                m,
                {
                  modelValue: On(Y),
                  "onUpdate:modelValue": (n[3] ||= (e) => {
                    if (un(Y)) {
                      return (Y.value = e);
                    }
                    return null;
                  }),
                  items: Fe,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
              D_1(
                m,
                {
                  modelValue: On(X),
                  "onUpdate:modelValue": (n[4] ||= (e) => {
                    if (un(X)) {
                      return (X.value = e);
                    }
                    return null;
                  }),
                  items: Ie,
                  size: `sm`,
                  class: `w-full sm:w-40`,
                },
                null,
                8,
                [`modelValue`],
              ),
            ]),
          ]),
          On(R)
            ? (mt(),
              b_1(`div`, ve, [
                __1(`div`, ye, [
                  __1(`div`, be, [
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
                            __1(`div`, xe, [
                              __1(`div`, Se, [
                                D_1(h, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(h, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, Ce, [
                                D_1(h, {
                                  class: `h-4 w-full mb-2`,
                                }),
                                D_1(h, {
                                  class: `h-3 w-2/3`,
                                }),
                              ]),
                              __1(`div`, we, [
                                D_1(h, {
                                  class: `h-6 w-16 mx-auto`,
                                }),
                              ]),
                              __1(`div`, Te, [
                                D_1(h, {
                                  class: `h-6 w-20 mx-auto`,
                                }),
                              ]),
                              __1(`div`, S, [
                                D_1(h, {
                                  class: `h-4 w-full`,
                                }),
                              ]),
                              __1(`div`, C, [
                                D_1(h, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(h, {
                                  class: `h-8 w-8`,
                                }),
                                D_1(h, {
                                  class: `h-8 w-8`,
                                }),
                              ]),
                            ]),
                            __1(`div`, w, [
                              __1(`div`, T, [
                                __1(`div`, E, [
                                  D_1(h, {
                                    class: `h-4 w-3/4 mb-2`,
                                  }),
                                  D_1(h, {
                                    class: `h-3 w-1/2`,
                                  }),
                                ]),
                                D_1(h, {
                                  class: `h-6 w-16 ml-2`,
                                }),
                              ]),
                              __1(`div`, D, [
                                D_1(h, {
                                  class: `h-4 w-24`,
                                }),
                                D_1(h, {
                                  class: `h-4 w-16`,
                                }),
                              ]),
                              __1(`div`, O, [
                                D_1(h, {
                                  class: `h-3 w-32`,
                                }),
                                __1(`div`, Ee, [
                                  D_1(h, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(h, {
                                    class: `h-8 w-8`,
                                  }),
                                  D_1(h, {
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
            : On(F).length
              ? (mt(),
                b_1(`div`, De, [
                  D_1(
                    g,
                    {
                      sessions: On(Re),
                      "show-history-actions": true,
                      onNotes,
                      onLoad,
                      onDelete,
                    },
                    null,
                    8,
                    [`sessions`],
                  ),
                  On(B)
                    ? (mt(),
                      b_1(`div`, Oe, [
                        D_1(
                          s,
                          {
                            label: `Load More`,
                            variant: `soft`,
                            color: `neutral`,
                            loading: On(z),
                            onClick: ze,
                          },
                          null,
                          8,
                          [`loading`],
                        ),
                      ]))
                    : y_1(``, true),
                ]))
              : !On(R) && On(F).length === 0
                ? (mt(),
                  b_1(`div`, ke, [
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
                            `No live trading history found`,
                          ),
                          __1(
                            `p`,
                            {
                              class: `text-sm mt-2`,
                            },
                            `Start a live session or change filters to see items in your history`,
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]))
                : y_1(``, true),
          D_1(
            _,
            {
              modelValue: On(I),
              "onUpdate:modelValue": (n[5] ||= (e) => {
                if (un(I)) {
                  return (I.value = e);
                }
                return null;
              }),
              title: `Delete Live Session`,
              description: `Are you sure you want to delete this live session? This action cannot be undone.`,
              type: `info`,
            },
            {
              default: qt(() => [
                D_1(s, {
                  variant: `solid`,
                  color: `error`,
                  block: ``,
                  class: `sm:w-auto`,
                  label: `Delete`,
                  onClick: Ue,
                }),
              ]),
              _: 1,
            },
            8,
            [`modelValue`],
          ),
          On(U)
            ? (mt(),
              v_1(
                v,
                {
                  key: 3,
                  modelValue: On(H),
                  "onUpdate:modelValue": (n[6] ||= (e) => {
                    if (un(H)) {
                      return (H.value = e);
                    }
                    return null;
                  }),
                  "session-id": On(U).id,
                  "initial-title": On(U).title,
                  "initial-description": On(U).description,
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
            b,
            {
              open: On(W),
              "onUpdate:open": (n[8] ||= (e) => {
                if (un(W)) {
                  return (W.value = e);
                }
                return null;
              }),
            },
            {
              content: qt(() => [
                __1(`div`, Ae, [
                  (n[13] ||= __1(
                    `h3`,
                    {
                      class: `text-lg font-semibold text-gray-900 dark:text-white mb-4`,
                    },
                    ` Purge Live Sessions `,
                    -1,
                  )),
                  __1(`div`, je, [
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
                      y,
                      {
                        label: `Delete sessions older than:`,
                        class: `mb-4`,
                      },
                      {
                        default: qt(() => [
                          D_1(
                            m,
                            {
                              modelValue: On(K),
                              "onUpdate:modelValue": (n[7] ||= (e) => {
                                if (un(K)) {
                                  return (K.value = e);
                                }
                                return null;
                              }),
                              items: Le,
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
                      ` This will permanently delete all live sessions that match your criteria. `,
                      -1,
                    )),
                  ]),
                  __1(`div`, Me, [
                    D_1(s, {
                      color: `neutral`,
                      variant: `ghost`,
                      label: `Cancel`,
                      onClick: qe,
                    }),
                    D_1(
                      s,
                      {
                        color: `error`,
                        label: `Purge Sessions`,
                        loading: On(G),
                        onClick: Ke,
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
export { A as default };
