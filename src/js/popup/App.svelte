<script lang="ts">
  import { onMount } from 'svelte';
  import Fa from 'svelte-fa/src/fa.svelte';
  import { faSlack } from '@fortawesome/free-brands-svg-icons';
  import { faExternalLinkAlt, faAngleDown } from '@fortawesome/free-solid-svg-icons';
  import { faSmileWink } from '@fortawesome/free-regular-svg-icons';

  import * as storage from '../storage';
  import Option from './Option.svelte';
  import type {
    SlackLocalStorageData,
    SlackLocalStorageDataTeam,
  } from '../types/slackLocalStorage';

  const msg = chrome.i18n.getMessage;

  let slackData: SlackLocalStorageData | undefined;
  let currentSlackTeamId: string;
  let currentSlackTeam: SlackLocalStorageDataTeam | undefined;

  onMount(async () => {
    slackData = await storage.get('slack');
    if (slackData) {
      await handleChangeCurrentTeamId(slackData.lastActiveTeamId);
    }
  });

  const handleChangeCurrentTeamId = async (teamId: string) => {
    // 選択中のチームの情報を更新
    currentSlackTeam = slackData?.teams[teamId];
  };
</script>

<div>
  <!-- Header-->
  <header class="header">
    <div class="header__wrapper">
      <span class="header__title">{msg('popup_header_title')}</span>
    </div>
  </header>
  <!-- Header End -->
  <div class="contents">
    {#if slackData && currentSlackTeam}
      <div class="workspace-select">
        <select
          class="workspace-select__select"
          bind:value={currentSlackTeamId}
          on:change={() => handleChangeCurrentTeamId(currentSlackTeamId)}
          on:blur={() => {}}
        >
          {#each slackData.orderedTeamIds as id}
            {#if slackData.teams[id]}
              <option value={id} selected={id === currentSlackTeam.id}>
                {slackData.teams[id].name}
              </option>
            {/if}
          {/each}
        </select>
        <div class="workspace-select__icon">
          <Fa icon={faAngleDown} />
        </div>
      </div>
      <div class="sub-contents">
        <ul class="action-list">
          <li class="action-list__item">
            <Fa icon={faSlack} size="lg" />
            {msg('open_chat')}
            <a href={currentSlackTeam.url} target="_blank">
              <Fa icon={faExternalLinkAlt} />
            </a>
          </li>
          <li class="action-list__item">
            <Fa icon={faSmileWink} size="lg" />

            {msg('customize_emoji')}
            <!-- urlは末尾に'/'が含まれる -->
            <a href={`${currentSlackTeam.url}customize/emoji`} target="_blank">
              <Fa icon={faExternalLinkAlt} />
            </a>
          </li>
        </ul>
        <hr />
        <Option slackTeamId={currentSlackTeamId} />
      </div>
    {:else}
      <div class="never-opened-slack-msg">
        <p class="never-opened-slack-msg__open-slack">
          {@html msg('never_opened_slack__open_slack')}
        </p>
        <p class="never-opened-slack-msg__reload">{msg('never_opened_slack__reload')}</p>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @import '../../css/popup-common.scss';

  :global(body) {
    min-width: 280px;
    max-width: 420px;
    margin: 0;
    padding: 0;
    color: $text-color-default;
    background-color: #f6f6f6;
    font-size: $font-size-middle;
  }

  hr {
    border: none;
    border-top: 1px solid #ddd;
    clear: both;
  }

  .contents {
    padding: 8px;
  }

  .sub-contents {
    padding: 8px;
    background-color: #ffffff;
    border: 1px solid $color-light-grey;
    border-radius: 5px;
  }

  .header {
    position: relative;
    background-color: #ffffff;
    box-shadow: 0 8px 8px -8px rgba(0, 0, 0, 0.5);

    &__wrapper {
      padding: 0.8rem 4px;
    }

    &__title {
      font-size: $font-size-large;
      font-weight: 100;
    }
  }

  .workspace-select {
    overflow: hidden;
    width: 100%;
    margin: 8px auto;
    text-align: center;
    position: relative;
    border: 1px solid $color-grey;
    border-radius: 30px;
    background: #ffffff;

    &__select {
      width: 100%;
      cursor: pointer;
      text-indent: 0.01px;
      text-overflow: ellipsis;
      border: none;
      outline: none;
      background: transparent none;
      box-shadow: none;
      -webkit-appearance: none;
      appearance: none;
      padding: 8px 38px 8px 8px;
      color: $color-grey;
    }

    &__icon {
      position: absolute;
      display: inline;
      pointer-events: none;
      padding: 8px 16px;
      top: 0;
      right: 0;
    }
  }

  .action-list {
    font-size: $font-size-middle;
    margin: 0;
    padding: 0.5em 1em 0.5em 0.5em;
    position: relative;

    &__item {
      line-height: 1.5;
      padding: 0.5em 0;
      list-style-type: none !important;
    }
  }

  .never-opened-slack-msg {
    padding: 8px;
    background-color: #ffffff;
    border: 1px solid $color-light-grey;
    border-radius: 5px;

    &__reload {
      color: $color-grey;
      font-size: $font-size-small;
    }
  }
</style>
