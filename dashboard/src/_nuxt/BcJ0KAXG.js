import {
  D as D_1,
  On,
  Qn,
  _ as __1,
  b as b_1,
  bt,
  g as g_1,
  k,
  mt,
  nr,
  o as o_1,
  tr,
  y as y_1,
} from "./CoKk4mC0.js";
import { t as t_1 } from "./BDNMzG2s2.js";
import { t as t_2 } from "./BRqV1csJ.js";
const h = {
  class: `progress-dial-display`,
};
const g = [`aria-label`, `aria-valuenow`];
const _ = {
  class: `progress-dial__segments`,
  "aria-hidden": `true`,
};
const v = {
  class: `progress-dial__core`,
};
const y = {
  class: `progress-dial__reading`,
};
const b = {
  key: 0,
  class: `progress-dial__status`,
};
const x = 32;
const S = -55;
export const t = Object.assign(
  t_1(
    k({
      __name: `CircleProgressbar`,
      props: {
        progress: {},
        statusText: {},
      },
      setup(s) {
        let p = 360 / x;
        let C = s;
        let w = g_1(() => {
          if (Number.isFinite(C.progress)) {
            return Math.min(100, Math.max(0, C.progress));
          }
          return 0;
        });
        let T = g_1(() => Math.round(w.value));
        let E = g_1(() => Math.ceil((w.value / 100) * x));
        return (o, C) => {
          let D = t_2;
          mt();
          return b_1(`div`, h, [
            __1(
              `div`,
              {
                class: Qn([
                  `progress-dial`,
                  {
                    "progress-dial--complete": On(w) >= 100,
                  },
                ]),
                role: `progressbar`,
                "aria-label": `Progress: ${On(T)}%`,
                "aria-valuenow": On(T),
                "aria-valuemin": `0`,
                "aria-valuemax": `100`,
              },
              [
                (C[0] ||= __1(
                  `div`,
                  {
                    class: `progress-dial__halo`,
                  },
                  null,
                  -1,
                )),
                (C[1] ||= __1(
                  `div`,
                  {
                    class: `progress-dial__axes`,
                    "aria-hidden": `true`,
                  },
                  null,
                  -1,
                )),
                __1(`div`, _, [
                  (mt(),
                  b_1(
                    o_1,
                    null,
                    bt(x, (e) =>
                      __1(
                        `span`,
                        {
                          key: e,
                          class: Qn([
                            `progress-dial__segment`,
                            {
                              "progress-dial__segment--active": e <= On(E),
                              "progress-dial__segment--tip": e === On(E),
                            },
                          ]),
                          style: tr({
                            "--segment-angle": `${(e - 1) * p}deg`,
                            "--segment-delay": `${(e - 1) * S}ms`,
                          }),
                        },
                        null,
                        6,
                      ),
                    ),
                    64,
                  )),
                ]),
                __1(`div`, v, [__1(`span`, y, nr(On(T)), 1)]),
              ],
              10,
              g,
            ),
            s.statusText
              ? (mt(),
                b_1(`p`, b, [
                  D_1(
                    D,
                    {
                      text: s.statusText,
                    },
                    null,
                    8,
                    [`text`],
                  ),
                ]))
              : y_1(``, true),
          ]);
        };
      },
    }),
    [[`__scopeId`, `data-v-8b4e450b`]],
  ),
  {
    __name: `CircleProgressbar`,
  },
);
