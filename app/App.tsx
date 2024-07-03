"use client";

import { fabric } from "fabric";

import Live from "@/components/Live";
import Navbar from "@/components/Navbar";

import { Provider, useSelector } from "react-redux";
import { store } from "./store";
import { selectDarkMode } from "@/slice/displaySlice";
import LeftSideBar from "@/components/LeftSideBar";
import RightSideBar from "@/components/RightSideBar";
import { useEffect, useRef, useState } from "react";
import {
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectMoving,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasZoom,
  handleCanvaseMouseMove,
  handlePathCreated,
  handleResize,
  initializeFabric,
  renderCanvas,
} from "@/lib/canvas";
import { ActiveElement, Attributes } from "@/types/type";
import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { defaultNavElement } from "@/constants";
import { handleImageUpload } from "@/lib/shapes";

export default function Page() {
  const undo = useUndo();
  const redo = useRedo();

  const darkMode = useSelector(selectDarkMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const shapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<string | null>(null);
  const isDrawing = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const activeObjectRef = useRef<fabric.Object | null>(null);
  const isEditingRef = useRef(false);

  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  const canvasObjects = useStorage((root) => root.canvasObjects);

  const syncShapeInStorage = useMutation(({ storage }, object) => {
    if (!object) return;

    const { objectId } = object;

    const shapedData = object.toJSON();

    shapedData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");

    canvasObjects.set(objectId, shapedData);
  }, []);

  const deleteAllShapes = useMutation(({ storage }) => {
    // get the canvasObjects store
    const canvasObjects = storage.get("canvasObjects");

    // if the store doesn't exist or is empty, return
    if (!canvasObjects || canvasObjects.size === 0) return true;

    // delete all the shapes from the store
    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    // return true if the store is empty
    return canvasObjects.size === 0;
  }, []);

  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    /**
     * canvasObjects is a Map that contains all the shapes in the key-value.
     * Like a store. We can create multiple stores in liveblocks.
     *
     * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
     */
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      // delete all the shapes from the canvas
      case "reset":
        // clear the storage
        deleteAllShapes();
        // clear the canvas
        fabricRef.current?.clear();
        // set "select" as the active element
        setActiveElement(defaultNavElement);
        break;

      // delete the selected shape from the canvas
      case "delete":
        // delete it from the canvas
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        // set "select" as the active element
        setActiveElement(defaultNavElement);
        break;

      // upload an image to the canvas
      case "image":
        // trigger the click event on the input element which opens the file dialog
        imageInputRef.current?.click();
        /**
         * set drawing mode to false
         * If the user is drawing on the canvas, we want to stop the
         * drawing mode when clicked on the image item from the dropdown.
         */
        isDrawing.current = false;

        if (fabricRef.current) {
          // disable the drawing mode of canvas
          fabricRef.current.isDrawingMode = false;
        }
        break;

      // for comments, do nothing
      case "comments":
        break;

      default:
        // set the selected shape to the selected element
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  useEffect(() => {
    const canvas = initializeFabric({ canvasRef, fabricRef });

    canvas.on("mouse:down", (options: any) => {
      handleCanvasMouseDown({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
      });
    });

    canvas.on("mouse:move", (options: any) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
      });
    });
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
        activeObjectRef,
      });
    });

    canvas.on("object:modified", (options: any) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    canvas.on("path:created", (options: any) => {
      handlePathCreated({
        options,
        syncShapeInStorage,
      });
    });

    canvas?.on("object:moving", (options: any) => {
      handleCanvasObjectMoving({
        options,
      });
    });

    canvas.on("selection:created", (options: any) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    canvas.on("object:scaling", (options: any) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    canvas.on("mouse:wheel", (options: any) => {
      handleCanvasZoom({
        options,
        canvas,
      });
    });

    window.addEventListener("resize", () => {
      handleResize({ fabricRef });
    });

    window.addEventListener("keydown", (e: any) => {
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      });
    });

    return () => {
      canvas.dispose();

      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, []);

  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  return (
    <main
      className={`${
        darkMode ? "bg-primary-grey-200" : "bg-white"
      } h-screen overflow-hidden`}
    >
      <Navbar
        activeElement={activeElement}
        handleActiveElement={handleActiveElement}
        imageInputRef={imageInputRef}
        handleImageUpload={(e: any) => {
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
      />
      <section className="flex h-full flex-row">
        <LeftSideBar allShapes={Array.from(canvasObjects)} />
        <Live canvasRef={canvasRef} redo={redo} undo={undo} />
        <RightSideBar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
}
