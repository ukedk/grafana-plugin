import { SelectableValue } from '@grafana/data';
import React from 'react';

interface HelmDragListProps {
    values: Array<SelectableValue<string | number>>,
    onChange: Function
}

export const HelmDragList: React.FC<HelmDragListProps> = ({ values, onChange }) => {
    const moveUp = (e: React.UIEvent<HTMLSpanElement>, index: number) => {
        const newValues = [...values]
        const movingValue = newValues.splice(index, 1);
        newValues.splice(index - 1, 0, movingValue[0])
        onChange(newValues);
    }
    const moveDown = (e: React.UIEvent<HTMLSpanElement>, index: number) => {
        const newValues = [...values]
        const movingValue = newValues.splice(index, 1);
        newValues.splice(index + 1, 0, movingValue[0])
        onChange(newValues);
    }
    const remove = (e: React.UIEvent<HTMLSpanElement>, index: number) => {
        const newValues = [...values]
        newValues.splice(index, 1);
        onChange(newValues)
    }
    const isEnterOrSpace = (key: string) => {
        return key === ' ' || key === 'Enter'
    }
    const keyUp = (e: React.KeyboardEvent<HTMLSpanElement>, index: number) => {
        if (isEnterOrSpace(e.key)) {
            moveUp(e, index)
        }
    }
    const keyDown = (e: React.KeyboardEvent<HTMLSpanElement>, index: number) => {
        if (isEnterOrSpace(e.key)) {
            moveDown(e, index)
        }
    }
    const keyDelete = (e: React.KeyboardEvent<HTMLSpanElement>, index: number) => {
        if (isEnterOrSpace(e.key)) {
            remove(e, index)
        }
    }
    return (
        <div className='helm-drag-list'>
            <style>
                {
                    `
                    .helm-drag-buttons {
                        display:flex;
                        margin-left:auto;
                    }
                    .helm-drag-list {
                        max-width:360px;
                    }
                    .helm-drag-button {
                        background-color:rgb(61, 113, 217);
                        border-radius:2px;
                        width:22px;
                        height:22px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        margin-right:6px;
                        cursor:pointer;
                    }
                    .helm-drag-button.helm-drag-remove {
                        background-color:rgb(239, 25, 32);
                    }
                    .helm-drag-wrapper{
                        height: 40px;
                        margin-bottom:6px;
                        display: flex;
                        align-items: center;
                        border:1px solid #2f2e2e;
                        padding:10px 15px;
                        border-radius:2px;
                    }
                    `
                }
            </style>
            {values.map((val, index) => (
                <div key={index} className='helm-drag-wrapper'>
                    <span>{index + 1}.&nbsp;</span>
                    <span>{val.label}</span>
                    <div className='helm-drag-buttons'>
                        <span className='helm-drag-button' tabIndex={0} onKeyUp={(e) => keyUp(e,index)} onClick={(e) => moveUp(e, index)}><i className='fa fa-arrow-up'></i></span>
                        <span className='helm-drag-button' tabIndex={0} onKeyUp={(e) => keyDown(e,index)} onClick={(e) => moveDown(e, index)}>
                            <i className='fa fa-arrow-down'></i>
                        </span>
                        <span className='helm-drag-button helm-drag-remove' onKeyUp={(e) => keyDelete(e,index)} tabIndex={0} onClick={(e) => remove(e, index)}><i className='fa fa-ban'></i></span>
                    </div>
                </div>
            ))}
        </div>
    )
}