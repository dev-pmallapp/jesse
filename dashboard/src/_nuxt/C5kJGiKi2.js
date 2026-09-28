import { D, O, S, tt, ut } from "./B8_r5oP7.js";
export const t = ut(`strategies`, {
  state: () => ({
    strategies: [],
    lastOpenedStrategy: null,
  }),
  getters: {
    navigationPath: (e) => {
      if (e.lastOpenedStrategy) {
        return `/strategies/${e.lastOpenedStrategy}`;
      }
      return `/strategies`;
    },
  },
  persist: {
    storage: tt.localStorage(),
  },
  actions: {
    rememberStrategy(e) {
      this.lastOpenedStrategy = e;
    },
    setStrategies(e) {
      this.strategies = e;
      if (this.lastOpenedStrategy && !e.includes(this.lastOpenedStrategy)) {
        this.lastOpenedStrategy = null;
      }
    },
    async getStrategies() {
      let { data, error } = await S(`/strategy/all`, {
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D(error);
        return;
      }
      let data_value = data.value;
      this.setStrategies(data_value.strategies);
    },
    async getStrategy(t) {
      let { data, error } = await S(`/strategy/get`, {
        method: `POST`,
        body: {
          name: t,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        return (D(error), ``);
      }
      return data.value.content;
    },
    async forkStrategy(new_name, i) {
      let { data, error } = await S(`/strategy/fork`, {
        method: `POST`,
        body: {
          new_name,
          content: i,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D(error);
        return false;
      }
      let data_value = data.value;
      O(`success`, data_value.message);
      return true;
    },
    async saveStrategy(r, i) {
      let { data, error } = await S(`/strategy/save`, {
        method: `POST`,
        body: {
          name: r,
          content: i,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D(error);
        return;
      }
      let data_value = data.value;
      O(`success`, data_value.message);
    },
    async deleteStrategy(r) {
      let { data, error } = await S(`/strategy/delete`, {
        method: `POST`,
        body: {
          name: r,
        },
        authenticated: true,
      });
      if (error.value && error.value.statusCode !== 200) {
        D(error);
        return;
      }
      let data_value = data.value;
      O(`success`, data_value.message);
      this.setStrategies(this.strategies.filter((e) => e !== r));
    },
  },
});
