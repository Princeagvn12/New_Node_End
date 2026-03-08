<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: [String, Number, Boolean, Object, Array],
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  name: { type: String, default: '' },
  required: { type: Boolean, default: false },
  min: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined },
  autocomplete: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="form-field">
    <label v-if="label" class="field-label">
      {{ label }}
      <span v-if="required" class="required-star">*</span>
    </label>
    <textarea
      v-if="type === 'textarea'"
      :name="name"
      :placeholder="placeholder"
      v-model="value"
      :required="required"
      class="field-input field-textarea"
      rows="3"
    />
    <div v-else-if="type === 'password'" class="field-password-wrap">
      <input
        :type="type"
        :name="name"
        :placeholder="placeholder"
        v-model="value"
        :required="required"
        :autocomplete="autocomplete"
        class="field-input"
      />
    </div>
    <input
      v-else
      :type="type"
      :name="name"
      :placeholder="placeholder"
      v-model="value"
      :required="required"
      :min="min"
      :step="step"
      :autocomplete="autocomplete"
      class="field-input"
    />
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.required-star {
  color: var(--color-danger);
  margin-left: 2px;
}
.field-input {
  width: 100%;
  padding: 0.625rem 0.85rem;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.field-input::placeholder {
  color: var(--text-muted);
}
.field-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.field-textarea {
  resize: vertical;
  min-height: 80px;
}
.field-password-wrap {
  position: relative;
}
.field-password-wrap .field-input {
  width: 100%;
}
</style>