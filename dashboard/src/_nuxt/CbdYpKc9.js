import {
  D as D_1,
  E as E_1,
  On,
  T as T_1,
  _,
  b as b_1,
  g as g_1,
  k,
  mt,
  qt,
  y as y_1,
} from "./CoKk4mC0.js";
import { st } from "./Cd-sGgPF.js";
import { r, t } from "./B8_r5oP7.js";
import { r as r_2 } from "./BpBaBBm3.js";
import { t as t_2 } from "./CJNUlr67.js";
import { t as t_3 } from "./BDNMzG2s2.js";
import { t as t_4 } from "./DcUUodPk.js";
const v = {
  key: 0,
  class: `relative min-h-[calc(100vh-5rem)]`,
};
const y = {
  class: `pointer-events-none select-none`,
  style: {
    filter: `blur(3px)`,
    opacity: `0.55`,
  },
};
const b = {
  class: `absolute inset-0 overflow-y-auto`,
};
const x = {
  class: `flex min-h-full items-center justify-center px-4 py-10`,
};
const S = {
  key: 0,
  class: `bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg w-full text-center`,
};
const C = {
  href: `https://jesse.trade/user/api-tokens`,
  target: `_blank`,
};
const w = {
  key: 1,
  class: `bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg w-full text-center`,
};
const T = {
  href: `https://docs.jesse.trade/docs/livetrade`,
  target: `_blank`,
};
const E = t_3(
  k({
    __name: `index`,
    setup(s) {
      r_2({
        title: `Live/Paper trading - Jesse`,
      });
      let g = t();
      let E = g_1(() => g.hasLivePluginInstalled);
      let D = g_1(() => g.plan === `guest`);
      let O = g_1(() => !E.value || D.value);
      let k = st();
      let A = r();
      if (E.value && !D.value) {
        let e = Object.keys(A.tabs);
        if (e.length > 0) {
          let t = e[0];
          let n = A.tabs[t];
          k.push({
            path: `/live/${n.id}`,
          });
        } else {
          A.addTab();
        }
      }
      return (o, s) => {
        let d = t_4;
        let f = t_2;
        if (On(O)) {
          return (
            mt(),
            b_1(`div`, v, [
              _(`div`, y, [
                D_1(d, null, {
                  left: qt(() => [
                    ...(s[0] ||= [
                      _(
                        `div`,
                        {
                          class: `space-y-6 w-full`,
                        },
                        [
                          _(
                            `div`,
                            {
                              class: `mb-4`,
                            },
                            [
                              _(`div`, {
                                class: `h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded-sm mb-3`,
                              }),
                              _(`div`, {
                                class: `h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600`,
                              }),
                            ],
                          ),
                          _(
                            `div`,
                            {
                              class: `space-y-3 mt-8`,
                            },
                            [
                              _(`div`, {
                                class: `h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded-sm`,
                              }),
                              _(`div`, {
                                class: `h-28 w-full bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600`,
                              }),
                            ],
                          ),
                          _(
                            `div`,
                            {
                              class: `space-y-3 mt-8`,
                            },
                            [
                              _(`div`, {
                                class: `h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded-sm`,
                              }),
                              _(
                                `div`,
                                {
                                  class: `flex gap-2`,
                                },
                                [
                                  _(`div`, {
                                    class: `h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600`,
                                  }),
                                  _(`div`, {
                                    class: `h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600`,
                                  }),
                                ],
                              ),
                            ],
                          ),
                          _(
                            `div`,
                            {
                              class: `space-y-3 mt-8`,
                            },
                            [
                              _(`div`, {
                                class: `h-3 w-28 bg-gray-300 dark:bg-gray-600 rounded-sm`,
                              }),
                              _(`div`, {
                                class: `h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600`,
                              }),
                              _(`div`, {
                                class: `h-3 w-48 bg-gray-200 dark:bg-gray-600 rounded-sm`,
                              }),
                            ],
                          ),
                          _(
                            `div`,
                            {
                              class: `space-y-3 mt-8`,
                            },
                            [
                              _(`div`, {
                                class: `h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded-sm`,
                              }),
                              _(
                                `div`,
                                {
                                  class: `flex gap-2`,
                                },
                                [
                                  _(`div`, {
                                    class: `h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-sm`,
                                  }),
                                  _(`div`, {
                                    class: `h-6 flex-1 bg-gray-200 dark:bg-gray-700 rounded-sm`,
                                  }),
                                ],
                              ),
                              _(
                                `div`,
                                {
                                  class: `flex gap-2`,
                                },
                                [
                                  _(`div`, {
                                    class: `h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-sm`,
                                  }),
                                  _(`div`, {
                                    class: `h-6 flex-1 bg-gray-200 dark:bg-gray-700 rounded-sm`,
                                  }),
                                ],
                              ),
                            ],
                          ),
                        ],
                        -1,
                      ),
                    ]),
                  ]),
                  right: qt(() => [
                    ...(s[1] ||= [
                      _(
                        `div`,
                        {
                          class: `space-y-3`,
                        },
                        [
                          _(`div`, {
                            class: `h-10 w-full bg-indigo-300 dark:bg-indigo-700 rounded-lg`,
                          }),
                          _(`div`, {
                            class: `h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg`,
                          }),
                        ],
                        -1,
                      ),
                    ]),
                  ]),
                  _: 1,
                }),
              ]),
              _(`div`, b, [
                _(`div`, x, [
                  On(g).plan === `guest`
                    ? (mt(),
                      b_1(`div`, S, [
                        (s[3] ||= T_1(
                          `<div class="flex items-center justify-center mb-5" data-v-db9d59ad><div class="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50" data-v-db9d59ad><svg class="h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" data-v-db9d59ad><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" data-v-db9d59ad></path></svg></div></div><h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2" data-v-db9d59ad> Authentication Required </h2><p class="text-gray-500 dark:text-gray-400 mb-6" data-v-db9d59ad> You need to authenticate with your jesse.trade account before you can access live trading. Add your <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm text-sm font-mono" data-v-db9d59ad>LICENSE_API_TOKEN</code> to your project&#39;s <code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm text-sm font-mono" data-v-db9d59ad>.env</code> file to get started. </p><div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-left mb-6" data-v-db9d59ad><ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300" data-v-db9d59ad><li data-v-db9d59ad> Visit <a href="https://jesse.trade/user/api-tokens" target="_blank" class="text-primary-500 hover:underline" data-v-db9d59ad>jesse.trade/user/api-tokens</a></li><li data-v-db9d59ad>Generate and copy your <code class="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-sm text-xs font-mono" data-v-db9d59ad>LICENSE_API_TOKEN</code></li><li data-v-db9d59ad> Add it to your project&#39;s <code class="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded-sm text-xs font-mono" data-v-db9d59ad>.env</code> file: <div class="mt-2 bg-gray-900 dark:bg-gray-950 rounded-lg px-4 py-2 font-mono text-xs text-green-400" data-v-db9d59ad> LICENSE_API_TOKEN=your-token-here </div></li><li data-v-db9d59ad>Restart Jesse to apply the changes</li></ol></div>`,
                          4,
                        )),
                        _(`a`, C, [
                          D_1(
                            f,
                            {
                              size: `lg`,
                              "trailing-icon": `i-heroicons-arrow-top-right-on-square`,
                            },
                            {
                              default: qt(() => [
                                ...(s[2] ||= [E_1(` Get My Token `, -1)]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                      ]))
                    : (mt(),
                      b_1(`div`, w, [
                        (s[5] ||= T_1(
                          `<div class="flex items-center justify-center mb-5" data-v-db9d59ad><div class="flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/50" data-v-db9d59ad><svg class="h-8 w-8 text-amber-500 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" data-v-db9d59ad><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" data-v-db9d59ad></path></svg></div></div><h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3" data-v-db9d59ad> Live Plugin Required </h2><p class="text-gray-500 dark:text-gray-400 mb-6" data-v-db9d59ad> Live and paper trading require the <strong class="text-gray-700 dark:text-gray-200" data-v-db9d59ad>jesse-live</strong> plugin to be installed in your project. Once installed, this page will let you run and monitor live trading sessions in real time. </p><div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-left mb-6" data-v-db9d59ad><ol class="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300" data-v-db9d59ad><li data-v-db9d59ad> Read the <a href="https://docs.jesse.trade/docs/livetrade" target="_blank" class="text-primary-500 hover:underline" data-v-db9d59ad>live trading documentation</a> to get started </li><li data-v-db9d59ad>Install the <strong data-v-db9d59ad>jesse-live</strong> plugin in your project</li><li data-v-db9d59ad>Restart Jesse to apply the changes</li></ol></div>`,
                          4,
                        )),
                        _(`a`, T, [
                          D_1(
                            f,
                            {
                              size: `lg`,
                              color: `primary`,
                              "trailing-icon": `i-heroicons-arrow-top-right-on-square`,
                            },
                            {
                              default: qt(() => [
                                ...(s[4] ||= [E_1(` View Documentation `, -1)]),
                              ]),
                              _: 1,
                            },
                          ),
                        ]),
                      ])),
                ]),
              ]),
            ])
          );
        }
        return y_1(``, true);
      };
    },
  }),
  [[`__scopeId`, `data-v-db9d59ad`]],
);
export { E as default };
