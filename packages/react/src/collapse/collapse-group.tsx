import React, { useMemo, useRef, useImperativeHandle } from 'react';
import { AriaAccordionProps } from '@react-types/accordion';
import { useTreeState } from '@react-stately/tree';
import { useAccordion } from '@react-aria/accordion';
import withDefaults from '../utils/with-defaults';
import { CollapseContext, CollapseConfig } from './collapse-context';
import useCurrentState from '../use-current-state';
import useTheme from '../use-theme';
import { setChildrenIndex } from '../utils/collections';
import { CSS } from '../theme/stitches.config';
import CollapseItem from './collapse';
import clsx from '../utils/clsx';

import {
  StyledCollapseGroup,
  CollapseGroupVariantsProps
} from './collapse.styles';
import Collapse from './collapse';

interface Props {
  accordion?: boolean;
  animated?: boolean;
  divider?: boolean;
  onChange?: (index?: number | undefined, value?: boolean) => void;
  as?: keyof JSX.IntrinsicElements;
}

const defaultProps = {
  accordion: true
};

type NativeAttrs = Omit<React.HTMLAttributes<unknown>, keyof Props>;

export type CollapseGroupProps<T = object> = Props &
  NativeAttrs &
  AriaAccordionProps<T> &
  CollapseGroupVariantsProps & { css?: CSS };

const CollapseGroup = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<CollapseGroupProps>
>((collapseGroupProps, ref: React.Ref<HTMLDivElement | null>) => {
  const {
    children,
    accordion,
    animated,
    divider,
    bordered,
    borderWeight,
    onChange,
    className,
    as,
    css,
    ...props
  } = collapseGroupProps;

  const ariaCollapseProps = { ...props, children };

  const [state, setState, stateRef] = useCurrentState<Array<number>>([]);

  const collapseRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => collapseRef?.current);

  const treeState = useTreeState(ariaCollapseProps);

  const {
    accordionProps
  }: {
    accordionProps: Omit<
      React.HTMLAttributes<unknown>,
      keyof CollapseGroupProps<unknown>
    >;
  } = useAccordion(ariaCollapseProps, treeState, collapseRef);

  const { isDark } = useTheme();

  const updateValues = (currentIndex: number, nextState: boolean) => {
    const hasChild = stateRef.current.find((val) => val === currentIndex);
    onChange && onChange(currentIndex, nextState);
    if (accordion) {
      if (nextState) return setState([currentIndex]);
      return setState([]);
    }
    if (nextState) {
      // In a few cases, the user will set Collapse Component state manually.
      // If the user incorrectly set the state, Group component should ignore it.
      /* istanbul ignore if */
      if (hasChild) return;
      return setState([...stateRef.current, currentIndex]);
    }
    setState(stateRef.current.filter((item) => item !== currentIndex));
  };

  const initialValue = useMemo<CollapseConfig>(
    () => ({
      values: state,
      updateValues,
      divider,
      animated
    }),
    [state.join(',')]
  );

  const hasIndexChildren = useMemo(
    () => setChildrenIndex(children, [Collapse]),
    [children]
  );

  return (
    <CollapseContext.Provider value={initialValue}>
      <StyledCollapseGroup
        ref={collapseRef}
        isDark={isDark}
        className={clsx('nextui-collapse-group', className)}
        bordered={bordered}
        borderWeight={borderWeight}
        as={as}
        css={css}
        {...props}
        {...accordionProps}
      >
        {[...treeState.collection].map((item) => (
          <CollapseItem
            title={item.title}
            key={item.key}
            item={item}
            state={state}
          />
        ))}
      </StyledCollapseGroup>
    </CollapseContext.Provider>
  );
});

CollapseGroup.displayName = 'NextUI - CollapseGroup';
CollapseGroup.toString = () => '.nextui-collapse-group';

export default withDefaults(CollapseGroup, defaultProps);
