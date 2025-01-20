import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import React, { FC } from 'react'

export default (props:any) => {
    const Content = NodeViewContent as FC<any>;
    const Wrapper = NodeViewWrapper as FC<any>;
    return (
        <Wrapper as='span'>
            <Content className="text-gray-300 select-none !inline"  >
                {props.node.attrs.content}
            </Content>
        </Wrapper>
    )
}