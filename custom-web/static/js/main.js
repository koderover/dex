const hostname = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port;

// login();
var dex = new Vue({
    el: "#dex-login",
    delimiters: ["<<<", ">>>"],
    data: {
        loading: false,
        loginForm: {
            account: "",
            password: "",
            captcha_answer: '',
            captcha_id: ''
        },
        otherLogin:{
            login:'',
            password:''
        },
        showRegistration: false,
        showLoginError: false,
        showPassword: false,
        rules: {
            account: [
                { required: true, message: '请输入用户名', trigger: 'change' }
            ],
            password: [{ required: true, message: '请输入密码', trigger: 'change' }]
        },
        captcha: null
    },
    computed: {
        year() {
            return new Date().getFullYear()
        }
    },
    methods: {
        async login() {
            this.$refs.loginForm.validate(async valid => {
                if (valid) {
                    const payload = this.loginForm;
                    this.loading = true
                    try {
                        const res = await axios.post("/api/v1/login", payload)
                        const userInfo = res.data;
                        if (userInfo) {
                            store.set("userInfo", userInfo);
                            const roleBindingRes = await axios.get(
                                `/api/v1/userbindings?uid=${userInfo.uid}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${userInfo.token}`,
                                    },
                                }
                            );
                            const roleBinding = roleBindingRes.data;
                            if (roleBinding) {
                                const role = roleBinding.map((item) => item.role);
                                store.set("role", role);
                                if (port) {
                                    window.location.href = `${protocol}//${hostname}:${port}/v1/projects`;
                                }
                                else {
                                    window.location.href = `${protocol}//${hostname}/v1/projects`;
                                }
                            }
                        }
                        else{
                            this.loading = false
                        }
                    }
                    catch (error) {
                        if (error.response && error.response.headers) {
                            const errorHeaders = error.response.headers
                            if (errorHeaders && errorHeaders['x-require-captcha'] === 'true') {
                                this.getCaptcha()
                            }
                        }
                        if(error.response && error.response.data && error.response.data.code){
                            msg = `${error.response.status} : ${error.response.data.message} ${error.response.data.description}`
                            this.$message.error(msg)
                        }
                        this.showLoginError = true;
                        this.loading = false
                       
                    }
                }
            })

        },
        async registrationCheck() {
            const registrationRes = await axios.get(`/api/v1/features/RegisterTrigger`);
            if (registrationRes.data && registrationRes.data.enabled) {
                this.showRegistration = true
            } else {
                this.showRegistration = false
            }
        },
        async getCaptcha () {
            this.captcha = null
            const res = await axios.get('/api/v1/captcha')
            if (res && res.data) {
              this.captcha = res.data
              this.loginForm.captcha_answer = ''
              this.loginForm.captcha_id = res.data.id
            }
        }
    },
    mounted() {
        this.registrationCheck();
    },
});
