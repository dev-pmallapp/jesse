import {
  Ht,
  _,
  b as b_1,
  bt,
  ct,
  ft,
  g,
  k,
  mt,
  nr,
  o,
  tr,
  tt,
  vn,
} from "./CoKk4mC0.js";
import { f } from "./B8_r5oP7.js";
import { t as t_1 } from "./eDEyLi0S.js";
import { n, r, t as t_2 } from "./CXuuVbXE.js";
const y = {
  class: `mt-2`,
};
const b = {
  class: `ml-2`,
};
export const t = Object.assign(
  k({
    __name: `EquityCurve`,
    props: {
      data: {},
    },
    setup(s) {
      let x = f();
      let S = g(() => x.value);
      let C = vn();
      let w = null;
      let T = [];
      let E = s;
      Ht(
        () => E.data,
        async (e) => {
          if (w !== null) {
            if (T.length !== e.length) {
              O();
              await tt();
              await D();
              return;
            }
            for (let t = 0; t < e.length; t++) {
              T[t].applyOptions({
                lineWidth: 2,
                color: e[t].color,
              });
              T[t].setData(e[t].data);
            }
            w.timeScale().fitContent();
          }
        },
        {
          deep: true,
        },
      );
      Ht(S, (e) => {
        k(e);
      });
      ct(async () => {
        await D();
      });
      async function D() {
        r.width = C.value.clientWidth;
        w = t_1(C.value, r);
        for (let e of E.data) {
          let t = w.addLineSeries({
            lineWidth: 2,
            color: e.color,
          });
          t.setData(e.data);
          T.push(t);
        }
        w.timeScale().fitContent();
        k(S.value);
      }
      ft(() => {
        O();
      });
      function O() {
        if (w !== null) {
          w.remove();
          w = null;
        }
        T &&= [];
      }
      function k(e) {
        if (!(w === null || T === null)) {
          w.applyOptions(e === `light` ? n.chart : t_2.chart);
        }
      }
      return (e, i) => {
        mt();
        return b_1(
          o,
          null,
          [
            _(
              `div`,
              {
                ref_key: `chartContainer`,
                ref: C,
                class: `rounded-sm overflow-hidden border-2 border-gray-100 dark:border-gray-800`,
              },
              null,
              512,
            ),
            _(`div`, y, [
              (mt(true),
              b_1(
                o,
                null,
                bt(s.data, (e) => {
                  mt();
                  return b_1(
                    `span`,
                    {
                      key: e.name,
                      class: `text-xs mr-2 rounded-sm bg-stone-50 dark:bg-stone-800 p-1`,
                    },
                    [
                      _(
                        `span`,
                        {
                          class: `inline-block`,
                          style: tr({
                            backgroundColor: e.color,
                            width: `25px`,
                            height: `10px`,
                          }),
                        },
                        null,
                        4,
                      ),
                      _(`span`, b, nr(e.name), 1),
                    ],
                  );
                }),
                128,
              )),
            ]),
          ],
          64,
        );
      };
    },
  }),
  {
    __name: `EquityCurve`,
  },
);
