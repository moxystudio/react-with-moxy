import React, { PureComponent } from 'react';
import Helmet from 'react-helmet';
import classNames from 'classnames';
import Hero from 'shared/components/hero/Hero';
import Svg from 'shared/components/svg/Svg';
import cakeSvg from 'shared/media/images/icons/cake.svg';
import thumbsUpSvg from 'shared/media/images/icons/thumbs-up.svg';
import thumbsDownSvg from 'shared/media/images/icons/thumbs-down.svg';
import childCareSvg from 'shared/media/images/icons/child-care.svg';
import styles from './About.css';

class About extends PureComponent {
    render() {
        return (
            <main className={ styles.aboutPage }>
                <Helmet title="About" />

                <Hero small />
                <div className={ styles.container }>
                    <h1>About</h1>
                    <p>This is the about page!</p>

                    <div className={ styles.block }>
                        <p>You may hover the icons to see their fill color animating:</p>

                        <Svg className={ styles.icon } svg={ cakeSvg } />
                        <Svg className={ styles.icon } svg={ thumbsUpSvg } />
                        <Svg className={ styles.icon } svg={ thumbsDownSvg } />
                        <Svg className={ styles.icon } svg={ childCareSvg } />
                    </div>

                    <div className={ styles.block }>
                        <p>The same icons as above but set via CSS:</p>

                        <i className={ classNames(styles.iconCss, styles.cake) } />
                        <i className={ classNames(styles.iconCss, styles.thumbsUp) } />
                        <i className={ classNames(styles.iconCss, styles.thumbsDown) } />
                        <i className={ classNames(styles.iconCss, styles.childCare) } />
                    </div>

                    <div className={ styles.block }>
                        <p>All icons below should be vertically aligned with the text:</p>

                        <div>
                            <Svg className={ styles.icon } svg={ cakeSvg } />
                            <span className={ styles.iconLabel }>Cake</span>
                        </div>
                        <div>
                            <Svg className={ styles.icon } svg={ thumbsUpSvg } />
                            <span className={ styles.iconLabel }>Thumbs up</span>
                        </div>
                        <div>
                            <Svg className={ styles.icon } svg={ thumbsDownSvg } />
                            <span className={ styles.iconLabel }>Thumbs down</span>
                        </div>
                        <div>
                            <Svg className={ styles.icon } svg={ childCareSvg } />
                            <span className={ styles.iconLabel }>Child care</span>
                        </div>
                    </div>
                </div>
            </main>
        );
    }
}

export default About;
