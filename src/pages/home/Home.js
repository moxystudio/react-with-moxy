import React, { PureComponent } from 'react';
// import Hero from 'shared/components/hero/Hero';
import styles from './Home.css';
import { marginCenter } from 'shared/helpers/helpers';

class Home extends PureComponent {
    constructor() {
        super();
        this.ref = React.createRef();
    }
    componentDidMount() {
        marginCenter(this.ref.current, 'window');
    }
    render() {
        const inline = {
            boxSizing: 'border-box',
            width: '800px',
            maxWidth: '100%',
            visibility: 'hidden',
        };

        return (
            <main className={ styles.homePage }>
                {/* <Hero /> */}
                <div ref={ this.ref } className={ styles.container } style={ inline }>
                    <h1>Heading 1</h1>
                    <p>
                        <a href="https://google.com">Lorem</a> ipsum <em>dolor</em> sit <strong>amet</strong>, consectetur adipiscing elit.
Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>

                    <h2>Heading 2</h2>
                    <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
            pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
            at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
            eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
            suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
            dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
            fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>

                    <h3>Heading 3</h3>
                    <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
            pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
            at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
            eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
            suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
            dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
            fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>

                    <h4>Heading 4</h4>
                    <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
            pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
            at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
            eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
            suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
            dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
            fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>

                    <h5>Heading 5</h5>
                    <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
            pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
            at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
            eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
            suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
            dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
            fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>

                    <h6>Heading 6</h6>
                    <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Donec nunc felis, ultricies sed justo ut, sodales rhoncus mauris. Curabitur aliquet diam ac elementum
            pellentesque. Pellentesque mollis, eros id laoreet convallis, lacus est vehicula nisl, at euismod lectus metus
            at velit. Nulla vulputate nibh a orci imperdiet, in tincidunt risus malesuada. Fusce rutrum lobortis magna,
            eget laoreet sapien ultricies eu. Proin pellentesque, nisl id commodo placerat, mauris lectus tristique leo, a
            suscipit magna metus id velit. Morbi feugiat ex ut mi lobortis vulputate. Sed facilisis
            dignissim odio non convallis. Nullam ac commodo felis. Ut in scelerisque eros. Duis at urna sed sem tincidunt
            fringilla. Aenean posuere neque nec mi consectetur, sed dapibus nulla laoreet.
                    </p>
                </div>
            </main>
        );
    }
}

export default Home;
