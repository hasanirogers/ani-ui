import { LitElement, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import styles from './styles.ts';
import userStore, { IUserStore } from '../../store/user.ts';
import alertStore, { IAlertStore } from '../../store/alert.ts';
import sharedStyles from '../../shared/styles.ts';

import * as FilePond from 'filepond';
import FilePondPluginFileEncode from 'filepond-plugin-file-encode';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
import FilePondStyles from 'filepond/dist/filepond.min.css';
import FilePondImagePreviewStyles from 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import KemetInput from 'kemet-ui/dist/components/kemet-input/kemet-input';
import { ENUM_ALERT_STATUS } from '../../shared/enums.ts';


const API_URL = import.meta.env.VITE_API_URL;

FilePond.registerPlugin(
  FilePondPluginFileEncode,
  FilePondPluginFileValidateType,
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform
);

@customElement('ani-profile')
export default class aniProfile extends LitElement {
  static styles = [styles, sharedStyles, FilePondStyles, FilePondImagePreviewStyles];

  @state()
  userState: IUserStore = userStore.getInitialState();

  @state()
  alertState: IAlertStore = alertStore.getInitialState();

  @state()
  filePond: any;

  @state()
  showUploadProfileImage: boolean = false;

  @query('form[action*=user]')
  userForm!: HTMLFormElement;

  @query('form[action*=change-password]')
  changePasswordForm!: HTMLFormElement;

  @query('input[name=filepond]')
  profileInput!: HTMLInputElement;

  @query('.filepond--root')
  filePondRoot!: any;

  constructor() {
    super();
    alertStore.subscribe((state) => {
      this.alertState = state;
    });
  }

  updated(changedProperties: any) {
    if (changedProperties.has('showUploadProfileImage') && this.showUploadProfileImage) {
      this.initFilePond();
    }
  }

  render() {
    return html`
      <kemet-tabs placement="top" divider>
        <kemet-tab slot="tab"><kemet-icon icon="info-circle" size="24"></kemet-icon>&nbsp;&nbsp;Information</kemet-tab>
        <kemet-tab slot="tab"><kemet-icon icon="passport" size="24"></kemet-icon>&nbsp;&nbsp;Change Password</kemet-tab>
        <kemet-tab-panel slot="panel">
          <kemet-card>
            <form method="post" action="api/users" @submit=${(event: SubmitEvent) => this.updateProfile(event)}>
              <fieldset>
                <legend>Welcome, ${this.userState?.profile?.username}</legend>
                <section class="profile">
                  <div class="profile-image">${this.makeProfileImage()}</div>
                  <div>
                    <p>
                      <kemet-field label="First Name">
                        <kemet-input slot="input" name="firstName" rounded value=${this.userState?.profile?.firstName}></kemet-input>
                      </kemet-field>
                    </p>
                    <p>
                      <kemet-field label="Last Name">
                        <kemet-input slot="input" name="lastName" rounded value=${this.userState?.profile?.lastName}></kemet-input>
                      </kemet-field>
                    </p>
                    <p>
                      <kemet-field label="Email">
                        <kemet-input slot="input" name="email" rounded value=${this.userState?.profile?.email}></kemet-input>
                      </kemet-field>
                    </p>
                  </div>
                </section>
                <br /><hr /><br />
                <kemet-button variant="rounded">
                  Update Profile <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
                </kemet-button>
              </fieldset>
            </form>
          </kemet-card>
        </kemet-tab-panel>
        <kemet-tab-panel slot="panel">
          <kemet-card>
            <form method="post" action="api/auth/change-password" @submit=${(event: SubmitEvent) => this.changePassword(event)}>
              <fieldset>
                <legend>Change Password</legend>
                <p>
                  <kemet-field label="Current Password">
                    <kemet-input required rounded slot="input" type="password" name="current_password" validate-on-blur></kemet-input>
                  </kemet-field>
                </p>
                <p>
                  <kemet-field slug="new_password" label="New Password">
                    <kemet-input slot="input" rounded type="password" name="new_password" required validate-on-blur></kemet-input>
                    <kemet-password slot="component" message="Please make sure you meet all the requirements."></kemet-password>
                  </kemet-field>
                </p>
                <p>
                  <kemet-field label="Confirm Password">
                    <kemet-input required rounded slot="input" type="password" name="confirm_password" validate-on-blur></kemet-input>
                  </kemet-field>
                </p>
                <br /><hr /><br />
                <kemet-button variant="rounded">
                  Change Password <kemet-icon slot="right" icon="chevron-right"></kemet-icon>
                </kemet-button>
              </fieldset>
            </form>
          </kemet-card>
        </kemet-tab-panel>
      </kemet-tabs>
    `;
  }

  initFilePond() {
    this.filePond = FilePond.create(this.profileInput, {
      labelIdle: `Drag & Drop your picture or <span class="filepond--label-action">Browse</span>`,
      imagePreviewHeight: 170,
      imageCropAspectRatio: '1:1',
      imageResizeTargetWidth: 200,
      imageResizeTargetHeight: 200,
      stylePanelLayout: 'compact circle',
      styleLoadIndicatorPosition: 'center bottom',
      styleButtonRemoveItemPosition: 'center bottom'
    });
  }

  makeProfileImage() {
    const profileImage = this.userState.profile?.avatar?.url;

    console.log(profileImage)

    if (profileImage && !this.showUploadProfileImage) {
      return html`
        <button class="image" @click=${() => this.showUploadProfileImage = true}>
          <div class="profile-picture" style="background-image: url('${API_URL}${profileImage}')"></div>
        </button>
        <button class="delete" aria-label="delete" @click=${(event: SubmitEvent) => this.deleteProfileImage(event)}>
          <kemet-icon icon="trash" size="32"></kemet-icon>
        </button>
      `;
    }

    this.showUploadProfileImage = true;

    return html`
      ${profileImage ? html`<button class="close" @click=${() => this.showUploadProfileImage = false} aria-label="delete"><kemet-icon icon="x-lg" size="32"></kemet-icon></button>` : ''}
      <input type="file" class="filepond" name="filepond" accept="image/png, image/jpeg, image/gif"/>
    `;
  }

  async updateProfile(event: SubmitEvent) {
    event.preventDefault();

    if (!this.userState.user) {
      return;
    }

    // Profile Information
    // -------------------
    const formData = new FormData(this.userForm) as any;

    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.userState.user.jwt}`
      },
      body: JSON.stringify(Object.fromEntries(formData))
    };

    const endpoint = this.userForm.getAttribute('action');

    const profile = await fetch(`${API_URL}/${endpoint}/${this.userState.user.user.id}`, options)
      .then((response) => response.json())
      .catch((error) => console.error(error));

    this.userState.updateProfile({
      ...profile,
      ...Object.fromEntries(formData)
    });

    // Upload Media
    // ---------------

    const hasFile = !!this.filePond?.getFile()?.file;
    const uploadFormData = new FormData();

    if (hasFile) {
      uploadFormData.append('files', this.filePond.getFile().file);
    }

    const uploadOptions = {
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.userState.user.jwt}`
      },
      body: uploadFormData
    }

    let avatar;

    if (hasFile) {
      avatar = await fetch(`${API_URL}/api/upload`, uploadOptions)
        .then((response) => response.json())
        .catch((error) => console.error(error));

      const avatarOptions = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userState.user.jwt}`
        },
        body: JSON.stringify({ avatar })
      };

      await fetch(`${API_URL}/${endpoint}/${this.userState.user.user.id}`, avatarOptions)
        .then((response) => response.json())
        .catch((error) => console.error(error));
    }
  }

  async deleteProfileImage(event: SubmitEvent) {
    event.preventDefault();
    this.showUploadProfileImage = true;
    this.userState.profile.avatar.url = '';

    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.userState.user.jwt}`
      },
      body: JSON.stringify({
        avatar: null,
      })
    }

    await fetch(`${API_URL}/api/users/${this.userState.user.user.id}`, options);

    const deleteOptions = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.userState.user.jwt}`
      },
    }

    await fetch(`${API_URL}/api/upload/files/${this.userState.profile.avatar.id}`, deleteOptions);
  }

  changePassword(event: SubmitEvent) {
    event.preventDefault();

    setTimeout(async () => {
      const fields = this.changePasswordForm.querySelectorAll('kemet-input');
      const hasErrors = Array.from(fields).some((field) => field.status === 'error');

      const currentPasswordInput = this.changePasswordForm.querySelector('[name="current_password"]') as KemetInput;
      const newPasswordInput = this.changePasswordForm.querySelector('[name="new_password"]') as KemetInput;
      const confirmPasswordInput = this.changePasswordForm.querySelector('[name="confirm_password"]') as KemetInput;

      if (hasErrors) {
        this.alertState.setStatus('error');
        this.alertState.setMessage('Please correct any errors in the fields.');
        this.alertState.setOpened(true);
        this.alertState.setIcon('exclamation-circle');
        return;
      }

      if (newPasswordInput.value !== confirmPasswordInput.value) {
        this.alertState.setStatus('error');
        this.alertState.setMessage('Your passwords do not match.');
        this.alertState.setOpened(true);
        this.alertState.setIcon('exclamation-circle');
        return;
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userState.user.jwt}`
        },
        body: JSON.stringify({
          user_id: this.userState.user.user_id,
          currentPassword: currentPasswordInput.value,
          password: newPasswordInput.value,
          passwordConfirmation: confirmPasswordInput.value
        })
      }

      await fetch(`${API_URL}/api/auth/change-password`, options)
        .then((response) => response.json())
        .then((responseData) => {
          console.log(responseData)
          this.alertState.setOpened(true);

          if (responseData.error) {
            this.alertState.setStatus(ENUM_ALERT_STATUS.ERROR);
            this.alertState.setMessage(responseData.error.message);
            this.alertState.setIcon('exclamation-circle');
          }

          if (responseData.jwt) {
            this.alertState.setStatus(ENUM_ALERT_STATUS.PRIMARY);
            this.alertState.setMessage('Password changed successfully.');
            this.alertState.setIcon('check-circle');
          }
        })
        .catch((error) => console.error(error));
    }, 1);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ani-profile': aniProfile
  }
}
