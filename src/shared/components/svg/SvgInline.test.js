import React from 'react';
import { shallow } from 'enzyme';
import SvgInline from './SvgInline';
import moxySquareSvg from 'shared/media/images/logos/moxy-square.inline.svg';

it('should render an inline SVG correctly', () => {
    const tree = shallow(<SvgInline svg={ moxySquareSvg } />);

    expect(tree).toMatchSnapshot();
});

it('should render with the specified className', () => {
    const tree = shallow(<SvgInline svg={ moxySquareSvg } className="foo" />);

    expect(tree).toMatchSnapshot();
});
