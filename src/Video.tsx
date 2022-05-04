import React, { forwardRef, useEffect, useState } from 'react'

const Video = forwardRef((props: any, ref: any) => {
    useEffect(() => {
        if (!ref.current) return
        const timer = setInterval(() => {
            console.log(ref.current.readyState)
            if (ref.current.readyState === 4) {
                clearInterval(timer)
                props.onLoad()
            }
        }, 200)
    }, [])

    console.log(props.src)

    return (
        <video ref={ref} {...props} />
    )
})

export default Video;