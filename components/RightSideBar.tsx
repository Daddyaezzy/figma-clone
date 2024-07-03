import { selectDarkMode } from "@/slice/displaySlice";
import React, { useMemo, useRef } from "react";
import { fabric } from "fabric";

import { RightSidebarProps } from "@/types/type";
import { bringElement, modifyShape } from "@/lib/shapes";

import Text from "./settings/Text";
import Color from "./settings/Color";
import Export from "./settings/Export";
import Dimensions from "./settings/Dimensions";
import { useSelector } from "react-redux";

const RightSideBar = ({
  elementAttributes,
  setElementAttributes,
  fabricRef,
  activeObjectRef,
  isEditingRef,
  syncShapeInStorage,
}: RightSidebarProps) => {
  const darkMode = useSelector(selectDarkMode);
  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);

  const handleInputChange = (property: string, value: string) => {
    if (!isEditingRef.current) isEditingRef.current = true;

    setElementAttributes((prev) => ({ ...prev, [property]: value }));

    modifyShape({
      canvas: fabricRef.current as fabric.Canvas,
      property,
      value,
      activeObjectRef,
      syncShapeInStorage,
    });
  };

  const memoizedContent = useMemo(
    () => (
      <section
        className={`flex flex-col border-t border-primary-grey-200 ${
          darkMode
            ? "bg-primary-black text-primary-grey-300"
            : "bg-[#ededed] text-black"
        }  min-w-[227px] sticky left-0 h-full max-sm:hidden select-none overflow-y-auto pb-20`}
      >
        <h3
          className={`border ${
            darkMode ? "border-primary-grey-200 " : "border-[#b2b0b0]"
          } px-5 py-4 text-xs uppercase`}
        >
          Design
        </h3>
        <span className="text-xs text-primary-grey-300 mt-3 px-5 border-b border-primary-grey-200 pb-4">
          Make changes to canvas as you like
        </span>

        <Dimensions
          isEditingRef={isEditingRef}
          width={elementAttributes.width}
          height={elementAttributes.height}
          handleInputChange={handleInputChange}
        />

        <Text
          fontFamily={elementAttributes.fontFamily}
          fontSize={elementAttributes.fontSize}
          fontWeight={elementAttributes.fontWeight}
          handleInputChange={handleInputChange}
        />

        <Color
          inputRef={colorInputRef}
          attribute={elementAttributes.fill}
          placeholder="color"
          attributeType="fill"
          handleInputChange={handleInputChange}
        />

        <Color
          inputRef={strokeInputRef}
          attribute={elementAttributes.stroke}
          placeholder="stroke"
          attributeType="stroke"
          handleInputChange={handleInputChange}
        />

        <Export />
      </section>
    ),
    [elementAttributes, darkMode]
  );

  return memoizedContent;
};

export default RightSideBar;
