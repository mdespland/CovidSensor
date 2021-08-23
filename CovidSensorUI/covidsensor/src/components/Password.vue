<script>
import axios from "axios";

const OAUTH2_API_URL = process.env.VUE_APP_OAUTH2_API_URL;
const OAUTH2_BEARER = process.env.VUE_APP_OAUTH2_BEARER;

const OAUTH2 = axios.create({
  baseURL: OAUTH2_API_URL,
  headers: {
    Authorization: "Bearer " + OAUTH2_BEARER,
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export default {
  data() {
    return {
        password: ""
    };
  },
  name: "Password",
  methods: {
    async authenticate() {
        try {
            var body="grant_type=password&username=configuration&password="+this.password
            var response=await OAUTH2.post("/oauth2/token" , body);
            this.password="";
            this.$emit("authenticate", response.data.access_token);
        } catch (error) {
            this.password="";
        }
    },
    cancel() {
      this.$emit("cancel");
    },
  },
};
</script>

<template>
  <transition name="modal-fade">
    <div class="modal-backdrop">
      <div
        class="modal"
        role="dialog"
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
      >
        <header class="modal-header" id="modalTitle">
          <slot name="header"> Authenticate </slot>
        </header>

        <section class="modal-body" id="modalDescription">
          <slot name="body">
            <input type="password" v-model="password" />
          </slot>
        </section>

        <footer class="modal-footer">
          <slot name="footer"> </slot>
          <button
            type="button"
            class="btn-green"
            @click="authenticate"
            aria-label="Close modal"
          >
            Authenticate
          </button>
          <button
            type="button"
            class="btn-red"
            @click="cancel"
            aria-label="Close modal"
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: #ffffff;
  box-shadow: 2px 2px 20px 1px;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

.modal-header,
.modal-footer {
  padding: 15px;
  display: flex;
}

.modal-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  color: #4aae9b;
  justify-content: space-between;
}

.modal-footer {
  border-top: 1px solid #eeeeee;
  flex-direction: column;
}

.modal-body {
  position: relative;
  padding: 20px 10px;
}

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  font-size: 20px;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
  color: #4aae9b;
  background: transparent;
}

.btn-green {
  color: white;
  background: #4aae9b;
  border: 1px solid #4aae9b;
  border-radius: 2px;
}

.btn-red {
  color: white;
  background: #ae614a;
  border: 1px solid #ae614a;
  border-radius: 2px;
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.5s ease;
}
</style>