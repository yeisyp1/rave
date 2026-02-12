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
export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
  },
})
