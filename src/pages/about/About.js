import React, { PureComponent } from 'react';
import Helmet from 'react-helmet';
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

                <div className={ styles.hero } />
                <div className={ styles.container }>
                    <h1>About</h1>
                    <p>This is the about page!</p>

                    <p>You may hover the icons to see their fill color animating.</p>

                    <p>
                        <Svg className={ styles.icon } svg={ cakeSvg } />
                        <Svg className={ styles.icon } svg={ thumbsUpSvg } />
                        <Svg className={ styles.icon } svg={ thumbsDownSvg } />
                        <Svg className={ styles.icon } svg={ childCareSvg } />
                    </p>

                    <div>
                        <Svg className={ styles.icon } svg={ cakeSvg } />
                        <span className={ styles.iconName }>Cake</span>
                    </div>
                    <div>
                        <Svg className={ styles.icon } svg={ thumbsUpSvg } />
                        <span className={ styles.iconName }>Thumbs up</span>
                    </div>
                    <div>
                        <Svg className={ styles.icon } svg={ thumbsDownSvg } />
                        <span className={ styles.iconName }>Thumbs down</span>
                    </div>
                    <div>
                        <Svg className={ styles.icon } svg={ childCareSvg } />
                        <span className={ styles.iconName }>Child care</span>
                    </div>
                </div>
            </main>
        );
    }
}

export default About;
