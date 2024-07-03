import { RootState } from "@/app/store";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface DisplayState {
  darkMode: boolean;
}

const initialState: DisplayState = {
  darkMode: true,
};

export const displaySlice = createSlice({
  name: "display",
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
  },
});

export const { setDarkMode } = displaySlice.actions;

export const selectDarkMode = (state: RootState) => state.display.darkMode;

export default displaySlice.reducer;
