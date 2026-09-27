import { configureStore, createSlice } from '@reduxjs/toolkit'
import { GoSidebarCollapse } from 'react-icons/go'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    sidebarCollapse: false,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    openSidebar: (state) => {
      state.sidebarOpen = true
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false
    },
      toggleSidebarCollapse: (state) => {
      state.sidebarCollapse = !state.sidebarCollapse
      },
  },
})

export const { toggleSidebar, openSidebar, closeSidebar, toggleSidebarCollapse } = uiSlice.actions

const alertModalSlice = createSlice({
  name: 'alertModal',
  initialState: {
    open: false,
    title: '',
    message: '',
    variant: 'info',
  },
  reducers: {
    showAlertModal: (state, action) => {
      const { message, title = '', variant = 'info' } = action.payload
      state.open = true
      state.message = message
      state.title = title
      state.variant = variant
    },
    closeAlertModal: (state) => {
      state.open = false
    },
  },
})

export const { showAlertModal, closeAlertModal } = alertModalSlice.actions
export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    alertModal: alertModalSlice.reducer,
  },
})
