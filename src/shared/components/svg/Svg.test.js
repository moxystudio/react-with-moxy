import React from 'react';
import { shallow } from 'enzyme';
import Svg from './Svg';
import cakeSvg from 'shared/media/images/icons/cake.svg';

it('should render a SVG correctly', () => {
    const tree = shallow(<Svg svg={ cakeSvg } />);

    expect(tree).toMatchSnapshot();
});

it('should render with the specified className', () => {
    const tree = shallow(<Svg svg={ cakeSvg } className="foo" />);

    expect(tree).toMatchSnapshot();
});
