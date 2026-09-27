import { n as n_1 } from "./QTnfLwEv.js";
import {
  D,
  E as E_1,
  On,
  Qn,
  _ as __1,
  b,
  bt,
  g,
  gn,
  k,
  mt,
  nr,
  o,
  qt,
  un,
  v,
  vn,
  wt,
  y,
} from "./CoKk4mC0.js";
import { Jt } from "./Cd-sGgPF.js";
import { t as t_1 } from "./2k_QeT3T.js";
import { D as D_2, O, S, t as t_2 } from "./B8_r5oP7.js";
import { r } from "./BpBaBBm3.js";
import { t as t_3 } from "./CQRhyXHt.js";
import { h } from "./DPJPAjQR.js";
import { t as t_4 } from "./atteXEGs.js";
import { t as t_5 } from "./OaeI3Ulg.js";
import { t as t_6 } from "./Cf85K_3V.js";
import { i as i_1, t as t_7 } from "./CJNUlr67.js";
import { t as t_8 } from "./BG8CfSEZ2.js";
import { t as t_9 } from "./JgXkd7uo2.js";
import { t as t_10 } from "./DEJw_qiA2.js";
import { t as t_11 } from "./B4Wc4BFL2.js";
import { t as t_12 } from "./TtSlr_h_2.js";
import { t as t_13 } from "./CUL-_UXV2.js";
import { t as t_14 } from "./DKSmMEZa2.js";
import { t as t_15 } from "./D1yN6wZY2.js";
const F = {
  class: `px-4 py-4 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40 sm:px-5`,
};
const I = {
  class: `flex items-start justify-between gap-3`,
};
const L = {
  class: `min-w-0`,
};
const R = {
  class: `flex flex-wrap items-center gap-2`,
};
const z = {
  class: `truncate text-sm font-semibold text-gray-900 dark:text-white`,
};
const B = {
  class: `mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400`,
};
const V = {
  class: `mt-4 grid gap-2 sm:grid-cols-2`,
};
const H = {
  key: 0,
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const U = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const W = {
  key: 1,
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60`,
};
const G = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const K = {
  key: 2,
  class: `rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60 sm:col-span-2`,
};
const q = {
  class: `mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200`,
};
const se = Object.assign(
  k({
    __name: `NotificationApiKey`,
    props: {
      apiKey: {},
    },
    setup(e) {
      let i = e;
      let s = vn(false);
      let c = vn(false);
      let l = t_2();
      async function u() {
        c.value = true;
        let { data, error } = await S(`/notification/api-keys/delete`, {
          method: `POST`,
          body: {
            id: i.apiKey.id,
          },
          authenticated: true,
        });
        c.value = false;
        if (error.value && error.value.statusCode !== 200) {
          D_2(error);
          return;
        }
        s.value = false;
        O(`success`, `API Key deleted successfully`);
        l.notificationApiKeys = l.notificationApiKeys.filter(
          (e) => e.id !== i.apiKey.id,
        );
      }
      return (i, l) => {
        let p = t_11;
        let g = i_1;
        let _ = t_7;
        let v = t_4;
        mt();
        return b(`article`, F, [
          __1(`div`, I, [
            __1(`div`, L, [
              __1(`div`, R, [
                __1(`h3`, z, nr(e.apiKey.name), 1),
                D(
                  p,
                  {
                    color: `neutral`,
                    variant: `soft`,
                    size: `xs`,
                  },
                  {
                    default: qt(() => [E_1(nr(e.apiKey.driver), 1)]),
                    _: 1,
                  },
                ),
              ]),
              __1(`p`, B, [
                D(g, {
                  name: `i-heroicons-clock`,
                  class: `size-3.5`,
                }),
                E_1(` ` + nr(On(h)(e.apiKey.created_at).value), 1),
              ]),
            ]),
            D(_, {
              icon: `i-heroicons-trash`,
              color: `error`,
              label: `Delete`,
              variant: `ghost`,
              size: `xs`,
              onClick: (l[0] ||= (e) => (s.value = true)),
            }),
          ]),
          __1(`dl`, V, [
            e.apiKey.bot_token
              ? (mt(),
                b(`div`, H, [
                  (l[2] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `Bot Token`,
                    -1,
                  )),
                  __1(`dd`, U, nr(e.apiKey.bot_token), 1),
                ]))
              : y(``, true),
            e.apiKey.chat_id
              ? (mt(),
                b(`div`, W, [
                  (l[3] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `Chat ID`,
                    -1,
                  )),
                  __1(`dd`, G, nr(e.apiKey.chat_id), 1),
                ]))
              : y(``, true),
            e.apiKey.webhook
              ? (mt(),
                b(`div`, K, [
                  (l[4] ||= __1(
                    `dt`,
                    {
                      class: `text-xs font-medium text-gray-500 dark:text-gray-400`,
                    },
                    `Webhook URL`,
                    -1,
                  )),
                  __1(`dd`, q, nr(e.apiKey.webhook), 1),
                ]))
              : y(``, true),
          ]),
          D(
            v,
            {
              modelValue: On(s),
              "onUpdate:modelValue": (l[1] ||= (e) => {
                if (un(s)) {
                  return (s.value = e);
                }
                return null;
              }),
              title: `Delete API Key`,
              description: `Are you sure you want to delete '${e.apiKey.name}' API key?`,
              type: `info`,
            },
            {
              default: qt(() => [
                D(
                  _,
                  {
                    variant: `solid`,
                    color: `error`,
                    block: ``,
                    class: `sm:w-auto`,
                    label: `Delete`,
                    loading: On(c),
                    onClick: u,
                  },
                  null,
                  8,
                  [`loading`],
                ),
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
  {
    __name: `NotificationApiKey`,
  },
);
const ce = {
  class: `flex shrink-0 gap-2`,
};
const le = {
  class: `mt-4 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60`,
};
const ue = {
  class: `mt-3 text-sm text-gray-600 dark:text-gray-300`,
};
const de = {
  class: `flex justify-end`,
};
const fe = {
  key: 0,
  class: `p-4`,
};
const pe = {
  key: 1,
  class: `divide-y divide-gray-100 dark:divide-gray-800`,
};
const me = {
  class: `flex items-center gap-2`,
};
const he = {
  class: `space-y-4`,
};
const ge = {
  class: `border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-600 transition-colors`,
};
const _e = {
  for: `notification-csv-file`,
  class: `cursor-pointer flex flex-col items-center gap-3`,
};
const ve = {
  class: `text-sm font-medium text-gray-700 dark:text-gray-300`,
};
const J = {
  class: `flex justify-end gap-3`,
};
export const t = k({
  __name: `notification-api-keys`,
  props: {
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  setup(e) {
    if (!e.embedded) {
      r({
        title: `Notification API Keys`,
      });
    }
    let u = vn(false);
    let E = t_2();
    let F = [
      {
        label: `Telegram`,
        value: `telegram`,
      },
      {
        label: `Discord`,
        value: `discord`,
      },
      {
        label: `Slack`,
        value: `slack`,
      },
    ];
    let I = gn({
      name: ``,
      driver: F[0].value,
      bot_token: ``,
      chat_id: ``,
      webhook: ``,
    });
    let L = g(() => E.notificationApiKeys);
    let R = g(() => {
      if (I.driver === `telegram`) {
        return I.bot_token && I.chat_id;
      }
      return I.webhook;
    });
    let z = vn(false);
    let B = vn(false);
    let V = gn({
      password: ``,
    });
    let H = vn(false);
    let U = vn(false);
    let W = vn(null);
    let G = vn(``);
    async function onSubmit() {
      if (!R.value) {
        O(`error`, `Please fill in all required fields`);
        return;
      }
      let e = {};
      if (I.driver === `telegram`) {
        e.bot_token = I.bot_token;
        e.chat_id = I.chat_id;
      } else if (I.driver === `discord` || I.driver === `slack`) {
        e.webhook = I.webhook;
      }
      let body = {
        driver: I.driver,
        name: I.name,
        fields: e,
      };
      u.value = true;
      let { data, error } = await S(`/notification/api-keys/store`, {
        method: `POST`,
        body,
        authenticated: true,
      });
      u.value = false;
      if (error.value && error.value.statusCode !== 200) {
        D_2(error);
      }
      let data_value = data.value;
      if (data_value.status === `success`) {
        O(`success`, `Successfully added API key`);
        L.value.push(data_value.data);
        Q();
      } else if (data_value.status === `error`) {
        O(`error`, data_value.message);
      }
    }
    async function q() {
      if (!V.password) {
        O(`error`, `Please enter your password!`);
        return;
      }
      B.value = true;
      try {
        let { data: e, error: t } = await S(
          `/download/download-notification-api-keys`,
          {
            method: `POST`,
            body: {
              password: V.password,
            },
            authenticated: true,
            responseType: `blob`,
          },
        );
        if (t?.value) {
          if (t.value.statusCode === 401) {
            O(`error`, `Incorrect password`);
          } else {
            O(`error`, t.value.data?.message || `Failed to download API keys`);
          }
          B.value = false;
          return;
        }
        if (!e.value) {
          O(`error`, `The notification API key export was empty`);
          return;
        }
        let n = window.URL.createObjectURL(e.value);
        let r = document.createElement(`a`);
        r.href = n;
        r.download = `notification-api-keys.csv`;
        document.body.appendChild(r);
        r.click();
        window.URL.revokeObjectURL(n);
        document.body.removeChild(r);
        O(`success`, `Notification API keys downloaded successfully`);
        z.value = false;
        V.password = ``;
      } catch (e) {
        O(`error`, `Failed to download API keys: ${e.message}`);
      } finally {
        B.value = false;
      }
    }
    async function onChange(e) {
      let t = e.target.files?.[0];
      if (t && t.type === `text/csv`) {
        G.value = t.name;
        W.value = await t.text();
      } else {
        alert(`Please select a valid CSV file`);
      }
    }
    async function X() {
      if (W.value) {
        U.value = true;
        try {
          let { data: e, error: t } = await S(
            `/download/import-notification-api-keys`,
            {
              method: `POST`,
              body: {
                content: W.value,
              },
              authenticated: true,
            },
          );
          if (t.value) {
            O(`error`, t.value);
            return;
          }
          E.fetchNotificationApiKeys();
          let n = e.value;
          if (n.success) {
            O(`success`, `${n.imported_count} API keys imported successfully`);
            H.value = false;
            Z();
            return;
          }
          O(`error`, n.error);
        } catch (e) {
          O(`error`, e);
        } finally {
          U.value = false;
        }
      }
    }
    function Z() {
      W.value = null;
      G.value = ``;
    }
    function Q() {
      I.chat_id = ``;
      I.bot_token = ``;
      I.webhook = ``;
      I.name = ``;
    }
    return (c, l) => {
      let _ = t_10;
      let x = t_7;
      let S = i_1;
      let C = t_3;
      let w = t_6;
      let T = t_8;
      let E = t_1;
      let Q = t_12;
      let $ = t_9;
      let ye = t_11;
      let be = t_14;
      let xe = se;
      let Se = t_4;
      let Ce = t_15;
      let we = t_5;
      mt();
      return v(
        wt(e.embedded ? `div` : t_13),
        {
          class: Qn(e.embedded ? `w-full space-y-3 lg:col-span-9` : ``),
        },
        {
          default: qt(() => [
            __1(
              `div`,
              {
                class: Qn(
                  e.embedded
                    ? `flex items-center justify-end gap-2`
                    : `mb-4 flex items-center justify-between gap-3`,
                ),
              },
              [
                e.embedded
                  ? y(``, true)
                  : (mt(),
                    v(
                      _,
                      {
                        key: 0,
                      },
                      {
                        default: qt(() => [
                          ...(l[12] ||= [E_1(` Notification API Keys `, -1)]),
                        ]),
                        _: 1,
                      },
                    )),
                __1(`div`, ce, [
                  D(x, {
                    icon: `i-heroicons-arrow-down-tray`,
                    color: `neutral`,
                    variant: `outline`,
                    size: `sm`,
                    label: `Export`,
                    onClick: (l[0] ||= (e) => (z.value = true)),
                  }),
                  D(x, {
                    icon: `i-heroicons-arrow-up-tray`,
                    color: `neutral`,
                    variant: `outline`,
                    size: `sm`,
                    label: `Import`,
                    onClick: (l[1] ||= (e) => (H.value = true)),
                  }),
                ]),
              ],
              2,
            ),
            __1(
              `div`,
              {
                class: Qn(
                  e.embedded
                    ? `space-y-3`
                    : `rounded-2xl border border-gray-200 bg-gray-100/70 p-2 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-3`,
                ),
              },
              [
                D(
                  $,
                  {
                    title: `Add notification API key`,
                  },
                  {
                    default: qt(() => [
                      (l[17] ||= __1(
                        `p`,
                        {
                          class: `text-sm text-gray-600 dark:text-gray-300`,
                        },
                        ` Here you can add your API keys for various notification drivers. API keys are used to connect your account to the notification driver and allow the bot to send notifications on your behalf. `,
                        -1,
                      )),
                      __1(`div`, le, [
                        D(S, {
                          name: `i-heroicons-shield-check`,
                          class: `mt-0.5 size-4 shrink-0 text-primary`,
                        }),
                        (l[13] ||= __1(
                          `p`,
                          {
                            class: `text-xs leading-5 text-gray-600 dark:text-gray-300`,
                          },
                          ` For security reasons, API keys cannot be modified or viewed again after they are created. `,
                          -1,
                        )),
                      ]),
                      __1(`p`, ue, [
                        (l[15] ||= E_1(
                          ` If you need help setting up your API keys, please refer to the documentation for `,
                          -1,
                        )),
                        D(
                          C,
                          {
                            class: `underline`,
                            href: `https://docs.jesse.trade/docs/notifications`,
                            target: `_blank`,
                          },
                          {
                            default: qt(() => [
                              ...(l[14] ||= [E_1(`notification drivers`, -1)]),
                            ]),
                            _: 1,
                          },
                        ),
                        (l[16] ||= E_1(`. `, -1)),
                      ]),
                      D(
                        Q,
                        {
                          state: On(I),
                          class: `mt-5 space-y-4`,
                          onSubmit,
                        },
                        {
                          default: qt(() => [
                            D(
                              T,
                              {
                                label: `Driver:`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    w,
                                    {
                                      modelValue: On(I).driver,
                                      "onUpdate:modelValue": (l[2] ||= (e) =>
                                        (On(I).driver = e)),
                                      "value-key": `value`,
                                      "search-input": false,
                                      items: F,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                            D(
                              T,
                              {
                                label: `Name:`,
                                required: ``,
                              },
                              {
                                default: qt(() => [
                                  D(
                                    E,
                                    {
                                      modelValue: On(I).name,
                                      "onUpdate:modelValue": (l[3] ||= (e) =>
                                        (On(I).name = e)),
                                      type: `text`,
                                      placeholder: `Give a name to this API key to identify it later`,
                                    },
                                    null,
                                    8,
                                    [`modelValue`],
                                  ),
                                ]),
                                _: 1,
                              },
                            ),
                            On(I).driver === `telegram`
                              ? (mt(),
                                v(
                                  T,
                                  {
                                    key: 0,
                                    label: `Bot Token:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        E,
                                        {
                                          modelValue: On(I).bot_token,
                                          "onUpdate:modelValue": (l[4] ||= (
                                            e,
                                          ) => (On(I).bot_token = e)),
                                          type: `text`,
                                          placeholder: `Enter your Telegram bot token`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(I).driver === `telegram`
                              ? (mt(),
                                v(
                                  T,
                                  {
                                    key: 1,
                                    label: `Chat ID:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        E,
                                        {
                                          modelValue: On(I).chat_id,
                                          "onUpdate:modelValue": (l[5] ||= (
                                            e,
                                          ) => (On(I).chat_id = e)),
                                          type: `text`,
                                          placeholder: `Enter your Telegram chat ID`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(I).driver === `discord`
                              ? (mt(),
                                v(
                                  T,
                                  {
                                    key: 2,
                                    label: `Webhook URL:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        E,
                                        {
                                          modelValue: On(I).webhook,
                                          "onUpdate:modelValue": (l[6] ||= (
                                            e,
                                          ) => (On(I).webhook = e)),
                                          type: `text`,
                                          placeholder: `Enter your Discord webhook URL`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            On(I).driver === `slack`
                              ? (mt(),
                                v(
                                  T,
                                  {
                                    key: 3,
                                    label: `Webhook URL:`,
                                    required: ``,
                                  },
                                  {
                                    default: qt(() => [
                                      D(
                                        E,
                                        {
                                          modelValue: On(I).webhook,
                                          "onUpdate:modelValue": (l[7] ||= (
                                            e,
                                          ) => (On(I).webhook = e)),
                                          type: `text`,
                                          placeholder: `Enter your Slack webhook URL`,
                                        },
                                        null,
                                        8,
                                        [`modelValue`],
                                      ),
                                    ]),
                                    _: 1,
                                  },
                                ))
                              : y(``, true),
                            __1(`div`, de, [
                              D(
                                x,
                                {
                                  type: `submit`,
                                  icon: `i-heroicons-plus`,
                                  class: `flex w-full justify-center sm:w-48`,
                                  label: `Create`,
                                  loading: On(u),
                                  disabled: !On(R),
                                },
                                null,
                                8,
                                [`loading`, `disabled`],
                              ),
                            ]),
                          ]),
                          _: 1,
                        },
                        8,
                        [`state`],
                      ),
                    ]),
                    _: 1,
                  },
                ),
                D(
                  $,
                  {
                    title: `Saved API keys`,
                    flush: ``,
                    "overflow-hidden": ``,
                    class: `mt-3`,
                  },
                  {
                    header: qt(() => [
                      D(
                        ye,
                        {
                          color: `neutral`,
                          variant: `soft`,
                          size: `xs`,
                        },
                        {
                          default: qt(() => [E_1(nr(On(L).length), 1)]),
                          _: 1,
                        },
                      ),
                    ]),
                    default: qt(() => [
                      On(L).length
                        ? (mt(),
                          b(`div`, pe, [
                            (mt(true),
                            b(
                              o,
                              null,
                              bt(On(L), (e) => {
                                mt();
                                return v(
                                  xe,
                                  {
                                    key: e.id,
                                    "api-key": e,
                                  },
                                  null,
                                  8,
                                  [`api-key`],
                                );
                              }),
                              128,
                            )),
                          ]))
                        : (mt(),
                          b(`div`, fe, [
                            D(be, null, {
                              default: qt(() => [
                                ...(l[18] ||= [
                                  E_1(` No API keys added yet `, -1),
                                ]),
                              ]),
                              _: 1,
                            }),
                          ])),
                    ]),
                    _: 1,
                  },
                ),
              ],
              2,
            ),
            D(
              Se,
              {
                modelValue: On(z),
                "onUpdate:modelValue": (l[9] ||= (e) => {
                  if (un(z)) {
                    return (z.value = e);
                  }
                  return null;
                }),
                title: `Export Notification API Keys`,
                type: `warning`,
                description: `You are about to export all your notification API keys to a CSV file. This file will contain sensitive credentials in plain text. Please enter your password to confirm.`,
              },
              {
                fields: qt(() => [
                  D(
                    T,
                    {
                      label: `Password`,
                      required: ``,
                      class: `mt-2`,
                    },
                    {
                      default: qt(() => [
                        D(
                          E,
                          {
                            modelValue: On(V).password,
                            "onUpdate:modelValue": (l[8] ||= (e) =>
                              (On(V).password = e)),
                            type: `password`,
                            placeholder: `Enter your password`,
                            class: `w-full`,
                            onKeyup: Jt(q, [`enter`]),
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
                default: qt(() => [
                  D(
                    x,
                    {
                      variant: `solid`,
                      color: `primary`,
                      block: ``,
                      class: `sm:w-auto`,
                      label: `Export API Keys`,
                      loading: On(B),
                      disabled: !On(V).password,
                      onClick: q,
                    },
                    null,
                    8,
                    [`loading`, `disabled`],
                  ),
                ]),
                _: 1,
              },
              8,
              [`modelValue`],
            ),
            D(
              we,
              {
                open: On(H),
                "onUpdate:open": (l[11] ||= (e) => {
                  if (un(H)) {
                    return (H.value = e);
                  }
                  return null;
                }),
                "onAfter:leave": Z,
              },
              {
                content: qt(() => [
                  D(Ce, null, {
                    header: qt(() => [
                      __1(`div`, me, [
                        D(S, {
                          name: `i-heroicons-arrow-up-tray`,
                          class: `w-5 h-5`,
                        }),
                        (l[19] ||= __1(
                          `h3`,
                          {
                            class: `text-lg font-semibold`,
                          },
                          `Import Notification API Keys from CSV`,
                          -1,
                        )),
                      ]),
                    ]),
                    footer: qt(() => [
                      __1(`div`, J, [
                        D(x, {
                          color: `neutral`,
                          variant: `ghost`,
                          label: `Cancel`,
                          onClick: (l[10] ||= (e) => {
                            H.value = false;
                            Z();
                          }),
                        }),
                        D(
                          x,
                          {
                            icon: `i-heroicons-arrow-up-tray`,
                            color: `primary`,
                            label: `Import API Keys`,
                            loading: On(U),
                            disabled: !On(W),
                            onClick: X,
                          },
                          null,
                          8,
                          [`loading`, `disabled`],
                        ),
                      ]),
                    ]),
                    default: qt(() => [
                      __1(`div`, he, [
                        (l[22] ||= __1(
                          `p`,
                          {
                            class: `text-sm text-gray-600 dark:text-gray-400`,
                          },
                          ` Select a CSV file containing your notification API keys. `,
                          -1,
                        )),
                        __1(`div`, ge, [
                          __1(
                            `input`,
                            {
                              id: `notification-csv-file`,
                              type: `file`,
                              class: `hidden`,
                              accept: `.csv`,
                              onChange,
                            },
                            null,
                            32,
                          ),
                          __1(`label`, _e, [
                            D(S, {
                              name: `i-heroicons-document-arrow-up`,
                              class: `w-12 h-12 text-gray-400`,
                            }),
                            __1(`div`, null, [
                              __1(
                                `p`,
                                ve,
                                nr(
                                  On(W) ? On(G) : `Click to select a CSV file`,
                                ),
                                1,
                              ),
                              (l[20] ||= __1(
                                `p`,
                                {
                                  class: `text-xs text-gray-500 dark:text-gray-400 mt-1`,
                                },
                                ` or drag and drop `,
                                -1,
                              )),
                            ]),
                          ]),
                          On(W)
                            ? (mt(),
                              v(
                                x,
                                {
                                  key: 0,
                                  icon: `i-heroicons-x-mark`,
                                  color: `error`,
                                  variant: `soft`,
                                  size: `xs`,
                                  class: `mt-3`,
                                  onClick: Z,
                                },
                                {
                                  default: qt(() => [
                                    ...(l[21] ||= [E_1(` Clear file `, -1)]),
                                  ]),
                                  _: 1,
                                },
                              ))
                            : y(``, true),
                        ]),
                      ]),
                    ]),
                    _: 1,
                  }),
                ]),
                _: 1,
              },
              8,
              [`open`],
            ),
          ]),
          _: 1,
        },
        8,
        [`class`],
      );
    };
  },
});
export const n = n_1({
  default: () => t,
});
