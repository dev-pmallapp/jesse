import { Qn, _, b, bt, k, mt, nr, o } from "./CoKk4mC0.js";
const c = {
  class: `flex flex-col`,
};
const l = {
  class: `-my-2 overflow-x-auto`,
};
const u = {
  class: `py-2 align-middle inline-block min-w-full`,
};
const d = {
  class: `min-w-full`,
};
const f = {
  class: `px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400`,
};
const p = {
  class: `px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100`,
};
export const t = Object.assign(
  k({
    __name: `KeyValueTable`,
    props: {
      data: {},
      noContainer: {
        type: Boolean,
      },
    },
    setup(i) {
      return (m, h) => {
        mt();
        return b(`div`, c, [
          _(`div`, l, [
            _(`div`, u, [
              _(
                `div`,
                {
                  class: Qn([
                    i.noContainer
                      ? `overflow-hidden rounded-b-lg bg-white dark:bg-gray-800`
                      : `border dark:border-gray-700 overflow-hidden rounded-lg bg-white dark:bg-gray-800`,
                  ]),
                },
                [
                  _(`table`, d, [
                    _(`tbody`, null, [
                      (mt(true),
                      b(
                        o,
                        null,
                        bt(i.data, (r, i) => {
                          mt();
                          return b(
                            `tr`,
                            {
                              key: i,
                              class: Qn(
                                i % 2 == 0
                                  ? `bg-white dark:bg-gray-800`
                                  : `bg-gray-100/70 dark:bg-gray-700/60`,
                              ),
                            },
                            [_(`td`, f, nr(r[0]), 1), _(`td`, p, nr(r[1]), 1)],
                            2,
                          );
                        }),
                        128,
                      )),
                    ]),
                  ]),
                ],
                2,
              ),
            ]),
          ]),
        ]);
      };
    },
  }),
  {
    __name: `KeyValueTable`,
  },
);
