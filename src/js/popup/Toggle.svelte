<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked: boolean;

  const handleClickToggle = () => {
    checked = !checked;
  };
  const dispatch = createEventDispatcher();

</script>

<span>
  <input type="checkbox" style="display:none" bind:checked />
  <span class="toggle" on:click={handleClickToggle} on:click={() => dispatch('toggled')}
    ><span /></span
  >
</span>

<style lang="scss">
  @import '../../css/popup-common.scss';

  .toggle {
    position: relative;
    display: inline-block;
    width: 40px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transform: translate3d(0, 0, 0);
    &:before {
      content: '';
      position: relative;
      top: 3px;
      left: 3px;
      width: 34px;
      height: 14px;
      display: block;
      background: $color-grey;
      border-radius: 8px;
      transition: background 0.2s ease;
    }
    span {
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      display: block;
      background: white;
      border-radius: 10px;
      box-shadow: 0 3px 8px rgba($color-grey, 0.5);
      transition: all 0.2s ease;
      &:before {
        content: '';
        position: absolute;
        display: block;
        margin: -18px;
        width: 56px;
        height: 56px;
        background: rgba($color-success, 0.5);
        border-radius: 50%;
        transform: scale(0);
        opacity: 1;
        pointer-events: none;
      }
    }
  }
  input[type='checkbox']:checked + .toggle {
    &:before {
      background: $color-success-light;
    }
    span {
      background: $color-success;
      transform: translateX(20px);
      transition: all 0.2s cubic-bezier(0.8, 0.4, 0.3, 1.25), background 0.15s ease;
      box-shadow: 0 3px 8px rgba($color-success-dark, 0.33);
      &:before {
        transform: scale(1);
        opacity: 0;
        transition: all 0.4s ease;
      }
    }
  }

</style>
