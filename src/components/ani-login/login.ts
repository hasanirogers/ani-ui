import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import userStore, { IUserStore } from '../../store/user';
import KemetInput from 'kemet-ui/dist/components/kemet-input/kemet-input';
import alertStore, { IAlertStore } from '../../store/alert';
import styles from './styles';
import sharedStyles from '../../shared/styles';
import KemetButton from 'kemet-ui/dist/components/kemet-button/kemet-button';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { ENUM_ALERT_STATUS } from '../../shared/enums';

interface ICredentials {
  identifier: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL;

@customElement('ani-login')
export default class aniLogin extends LitElement {
  static styles = [styles, sharedStyles];

  @state()
  userState: IUserStore = userStore.getInitialState();

  @state()
  alertState: IAlertStore = alertStore.getInitialState();

  @state()
  forgotStatus: string = '';

  @state()
  resetEmail: string = '';

  @state()
  resetPassword: string = '';

  @query('form[action*=auth]')
  loginForm!: HTMLFormElement;

  @query('form[action*=register]')
  registerForm!: HTMLFormElement;

  @query('form[action*=reset]')
  resetForm!: HTMLFormElement;

  @query('form[action*=set-password]')
  setPasswordForm!: HTMLFormElement;

  @query('[name=identifier]')
  loginIdentifier!: KemetInput;

  @query('[name=password]')
  loginPassword!: KemetInput;

  @query('form[action*=jwt-auth] kemet-button')
  loginButton!: KemetButton;

  render() {
    return html`
      <kemet-card>
        <kemet-tabs placement="bottom" divider>
          <kemet-tab slot="tab">Login</kemet-tab>
          <kemet-tab slot="tab">Register</kemet-tab>
          <kemet-tab slot="tab">Forgot Password</kemet-tab>
          <kemet-tab-panel slot="panel">
            <form method="post" action="api/auth/local" @submit=${(event: SubmitEvent) => this.handleLogin(event)}>
              <p>
                <kemet-field label="Username">
                  <kemet-input required slot="input" name="identifier" rounded validate-on-blur></kemet-input>
                </kemet-field>
              </p>
              <p>
                <kemet-field label="Password">
                  <kemet-input required slot="input" type="password" name="password" validate-on-blur></kemet-input>
                </kemet-field>
              </p>
              <br />
              <kemet-button variant="rounded">
               Login <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
              </kemet-button>
            </form>
          </kemet-tab-panel>
          <kemet-tab-panel slot="panel">
            <form method="post" action="api/auth/local/register" @submit=${(event: SubmitEvent) => this.handleRegistration(event)}>
              <kemet-field slug="username" label="Username" message="A valid username is required">
                <kemet-input required slot="input" name="username" validate-on-blur></kemet-input>
              </kemet-field>
              <br />
              <kemet-field slug="user_pass" label="New Password" status="standard">
                <kemet-input slot="input" type="password" name="password" status="standard"></kemet-input>
                <kemet-password slot="component" message="Please make sure you meet all the requirements."></kemet-password>
              </kemet-field>
              <br />
              <kemet-field slug="email" label="Email" message="A valid email is required">
                <kemet-input required slot="input" name="email" type="email" validate-on-blur></kemet-input>
              </kemet-field>
              <br />
              <kemet-button variant="rounded">
                Register <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
              </kemet-button>
            </form>
          </kemet-tab-panel>
          <kemet-tab-panel slot="panel">
            ${this.makeForgotPassword()}
          </kemet-tab-panel>
        </kemet-tabs>
      </kemet-card>
    `
  }


  handleLogin(event: SubmitEvent) {
    event.preventDefault();

    const credentials = {
      identifier: this.loginIdentifier.value,
      password: this.loginPassword.value,
    };

    this.fetchLogin(credentials);
  }

  fetchLogin(credentials: ICredentials) {
    const options = {
      method: this.loginForm.getAttribute('method')?.toUpperCase(),
      body: JSON.stringify(credentials),
      headers: { 'Content-Type': 'application/json' }
    };

    const endpoint = this.loginForm.getAttribute('action');

    fetch(`${API_URL}/${endpoint}`, options)
      .then(response => response.json())
      .then(async response => {
        // bad access
        if (response.error?.status === 400) {
          this.alertState.setStatus('error');
          this.alertState.setMessage(unsafeHTML('Oh boy, looks like a bad username or password.'));
          this.alertState.setOpened(true);
          this.alertState.setIcon('exclamation-circle');
        }

        // success
        if (response.jwt) {
          const options = {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.jwt}`
            }
          };
          const userProfile = await fetch(`${API_URL}/api/users/me?populate=*`, options).then((response) => response.json());
          this.userState.updateProfile(userProfile);
          this.userState.login(response);
          window.location.href = '/';
        }
      })
      // .catch(() => {
      //   this.alertState.setStatus('error');
      //   this.alertState.setMessage('There was an unknown problem while logging you in.');
      //   this.alertState.setOpened(true);
      //   this.alertState.setIcon('exclamation-circle');
      // });
  }

  handleRegistration(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(this.registerForm) as any;

    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    };

    const endpoint = this.registerForm.getAttribute('action');

    fetch(`${API_URL}/${endpoint}`, options)
      .then(response => response.json())
      .then((responseData) => {
          // this.alertState.setMessage('An error was encountered while registering.');

          if (responseData.error) {
            this.alertState.setStatus('error');
            this.alertState.setMessage(responseData.error.message);
            this.alertState.setOpened(true);
            this.alertState.setIcon('exclamation-circle');
          }

          if (responseData.user) {
            const credentials = {
              identifier: responseData.user.email,
              password: formData.get('password'),
            }

            this.alertState.setStatus(ENUM_ALERT_STATUS.PRIMARY);
            this.alertState.setOpened(true);
            this.alertState.setMessage('You\'re all set!');

            this.fetchLogin(credentials);
          }


      })
      .catch(() => {
        this.alertState.setStatus(ENUM_ALERT_STATUS.ERROR);
        this.alertState.setMessage('There was an unknown problem while registering.');
        this.alertState.setOpened(true);
        this.alertState.setIcon('exclamation-circle');
      });
  }

  handleForgotPassword(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(this.resetForm) as any;

    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    };

    const endpoint = this.resetForm.getAttribute('action');

    fetch(`${API_URL}/${endpoint}`, options)
      .then(response => response.json())
      .then((responseData) => {
        if (responseData.data.status === 200) {
          this.forgotStatus = 'enter-code';
        } else {
          this.alertState.setStatus('error');
          this.alertState.setMessage(unsafeHTML(responseData.message) || 'An unknown problem has occurred.');
          this.alertState.setOpened(true);
          this.alertState.setIcon('exclamation-circle');
        }
      });
  }

  handleNewPassword(event: SubmitEvent) {
    event.preventDefault();

    const formData = new FormData(this.setPasswordForm) as any;
    const options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(Object.fromEntries(formData))
    };
    const endpoint = this.setPasswordForm.getAttribute('action');

    fetch(`${API_URL}/${endpoint}`, options)
      .then(response => response.json())
      .then((responseData) => {
        if (responseData.data.status === 200) {
          const credentials = {
            identifier: this.resetEmail,
            password: this.resetPassword
          }

          this.alertState.setStatus('success');
          this.alertState.setMessage(unsafeHTML(responseData.message));
          this.alertState.setOpened(true);
          this.alertState.setIcon('check-circle');

          setTimeout(() => this.fetchLogin(credentials), 1000 * 3);
        } else {
          this.alertState.setStatus('error');
          this.alertState.setMessage(unsafeHTML(responseData.message) || 'An unknown problem has occurred.');
          this.alertState.setOpened(true);
          this.alertState.setIcon('exclamation-circle');

          if (responseData.message.indexOf('You must request a new code.') > -1) {
            this.forgotStatus = 'resend';
          }
        }
      });
  }

  makeForgotPassword() {
    if (this.forgotStatus === 'enter-code') {
      return html`
        <form method="post" action="wp-json/bdpwr/v1/set-password" @submit=${(event: SubmitEvent) => this.handleNewPassword(event)}>
          <kemet-input name="email" type="hidden" value=${this.resetEmail}></kemet-input>
          <br />
          <kemet-field slug="code" label="Enter the code your received via email" message="A code is required">
            <kemet-input required slot="input" name="code" type="password" validate-on-blur></kemet-input>
          </kemet-field>
          <br />
          <kemet-field slug="password" label="New Password" status="standard">
            <kemet-input
              slot="input"
              type="password"
              name="password"
              status="standard"
              @kemet-input-input=${(event: CustomEvent) => this.resetPassword = event.detail}>
            </kemet-input>
            <kemet-password slot="component" message="Please make sure you meet all the requirements."></kemet-password>
          </kemet-field>
          <br />
          <kemet-button>
            Set Password <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
          </kemet-button>
        </form>
      `;
    }

    if (this.forgotStatus === 'success') {
      return html`
        <p>You've successfully reset your password!</p>
      `;
    }

    return html`
      <form method="post" action="wp-json/bdpwr/v1/reset-password" @submit=${(event: SubmitEvent) => this.handleForgotPassword(event)}>
        <kemet-field slug="email" label="Email" message="A valid email is required">
          <kemet-input
            required
            slot="input"
            name="email"
            type="email"
            validate-on-blur
            @kemet-input-input=${(event: CustomEvent) => this.resetEmail = event.detail }>
          </kemet-input>
        </kemet-field>
        <br />
        <kemet-button>
          Reset Password <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
        </kemet-button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ani-login': aniLogin
  }
}
