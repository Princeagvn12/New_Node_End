<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: [String, Number, Boolean, Object, Array],
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  name: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="form-field">
    <label v-if="label" class="block text-sm mb-1">{{ label }}</label>
    <input v-if="type !== 'textarea'" :type="type" :name="name" :placeholder="placeholder" v-model="value" :required="required" class="w-full p-2 rounded border" />
    <textarea v-else :name="name" :placeholder="placeholder" v-model="value" :required="required" class="w-full p-2 rounded border" />
  </div>
</template>

<style scoped>
.form-field input,
.form-field textarea {
  background: transparent;
}
</style>
<!-- placeholder: frontend/src/components/common/FormField.vue -->