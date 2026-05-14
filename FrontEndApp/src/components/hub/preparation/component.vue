<template>
  <div v-show='show' class='container'>
    123
  </div>
</template>

<script lang='ts' setup>
defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});
</script>